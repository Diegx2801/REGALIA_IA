import { CurrencyPipe, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin, of } from 'rxjs';
import { SesionAutenticacionService } from '../../../../core/autenticacion/sesion-autenticacion.service';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { ProductoApiService } from '../../../catalogo/acceso-datos/producto-api.service';
import { Producto } from '../../../catalogo/modelos/producto.model';
import { TipoEntregaApiService } from '../../../datos-maestros/acceso-datos/tipo-entrega-api.service';
import { TipoEntrega } from '../../../datos-maestros/modelos/tipo-entrega.model';
import { CheckoutApiService } from '../../acceso-datos/checkout-api.service';
import { ItemCarrito } from '../../../../core/carrito/carrito.model';
import { OpcionPagoInicial } from '../../modelos/checkout.model';
import { CarritoCheckoutService } from '../../../../core/carrito/carrito-checkout.service';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import {
  CampoFormularioDirective,
  ErrorCampoDirective,
} from '../../../../shared/directivas/formulario-panel.directive';

@Component({
  selector: 'app-pagina-solicitud-checkout',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
    BotonDirective,
    CampoFormularioDirective,
    ErrorCampoDirective,
  ],
  templateUrl: './pagina-solicitud-checkout.html',
  styleUrl: './pagina-solicitud-checkout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaSolicitudCheckout implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly documento = inject(DOCUMENT);
  private readonly sesionAutenticacion = inject(SesionAutenticacionService);
  private readonly productoApiService = inject(ProductoApiService);
  private readonly tipoEntregaApiService = inject(TipoEntregaApiService);
  private readonly checkoutApiService = inject(CheckoutApiService);
  private readonly carritoCheckout = inject(CarritoCheckoutService);

  readonly producto = signal<Producto | null>(null);
  readonly itemsSolicitud = signal<ItemCarrito[]>([]);
  readonly tiposEntrega = signal<TipoEntrega[]>([]);
  readonly opcionesPago = signal<OpcionPagoInicial[]>([]);
  readonly cargandoDatos = signal(true);
  readonly enviandoSolicitud = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly cantidadSeleccionada = signal(1);
  readonly usaCarrito = signal(false);
  readonly fechaMinimaEntrega = this.obtenerFechaMinimaEntrega();

  readonly formulario = new FormGroup({
    cantidad: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    idTipoEntrega: new FormControl<number | null>(null, [Validators.required]),
    codigoTipoPago: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    fechaEntrega: new FormControl(this.fechaMinimaEntrega, {
      nonNullable: true,
      validators: [Validators.required, fechaNoAnteriorA(this.fechaMinimaEntrega)],
    }),
    observacion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(1000)],
    }),
  });

  readonly totalEstimado = computed(() => {
    if (this.usaCarrito()) {
      return this.itemsSolicitud().reduce(
        (total, item) => total + item.precioUnitario * item.cantidad,
        0,
      );
    }

    const productoActual = this.producto();
    return productoActual ? productoActual.precio * this.cantidadSeleccionada() : 0;
  });

  readonly requiereLogin = computed(() => !this.sesionAutenticacion.estaAutenticado());
  readonly requiereRolCliente = computed(
    () =>
      this.sesionAutenticacion.estaAutenticado() && !this.sesionAutenticacion.tieneRol(['CLIENTE']),
  );
  readonly requiereCorreoVerificado = computed(
    () =>
      this.sesionAutenticacion.tieneRol(['CLIENTE']) &&
      !this.sesionAutenticacion.usuarioActual()?.correoVerificado,
  );
  readonly checkoutBloqueado = computed(
    () => this.requiereLogin() || this.requiereRolCliente() || this.requiereCorreoVerificado(),
  );
  readonly requiereObservacionGeneral = computed(() => !this.usaCarrito());
  readonly cantidadItemsSolicitud = computed(() =>
    this.itemsSolicitud().reduce((total, item) => total + item.cantidad, 0),
  );
  readonly rutaRetorno = computed(() => {
    if (this.usaCarrito()) return '/checkout/carrito';
    const idProducto = this.producto()?.idProducto;
    return idProducto ? `/checkout/solicitud/${idProducto}` : '/catalogo';
  });

  ngOnInit(): void {
    this.sincronizarFormularioConSignals();
    this.cargarDatosIniciales();
  }

  continuarAlPago(): void {
    this.mensajeError.set(null);

    if (this.requiereLogin()) {
      this.mensajeError.set('Inicia sesión como cliente para continuar con tu compra.');
      return;
    }

    if (this.requiereRolCliente()) {
      this.mensajeError.set('Necesitas una cuenta de cliente para continuar con tu compra.');
      return;
    }

    if (this.requiereCorreoVerificado()) {
      this.mensajeError.set('Verifica el correo de tu cuenta antes de continuar al pago.');
      return;
    }

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.mensajeError.set('Revisa los campos señalados antes de continuar.');
      this.enfocarPrimerCampoInvalido();
      return;
    }

    const items = this.obtenerItemsParaCheckout();
    const valorFormulario = this.formulario.getRawValue();

    if (items.length === 0 || valorFormulario.idTipoEntrega === null) {
      this.mensajeError.set('Completa los productos y datos de entrega para continuar.');
      return;
    }

    if (!this.todosLosItemsSonDeLaMismaTienda(items)) {
      this.mensajeError.set('Para esta compra, elige productos de una sola tienda.');
      return;
    }

    this.enviandoSolicitud.set(true);

    // El servidor crea una sesión de pago después de validar la compra.
    this.checkoutApiService
      .crearSesionCheckout({
        proveedor: 'MERCADO_PAGO',
        idTienda: items[0].idTienda,
        idTipoEntrega: valorFormulario.idTipoEntrega,
        codigoTipoPago: valorFormulario.codigoTipoPago,
        fechaEntrega: valorFormulario.fechaEntrega,
        observacion: this.construirObservacionCheckout(valorFormulario.observacion, items),
        items: items.map((item) => ({
          idProducto: item.idProducto,
          cantidad: item.cantidad,
        })),
      })
      .pipe(
        finalize(() => this.enviandoSolicitud.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (resultado) => {
          if (!resultado.urlRedireccion) {
            this.mensajeError.set('No pudimos abrir el pago seguro. Inténtalo nuevamente.');
            return;
          }
          window.location.assign(resultado.urlRedireccion);
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeErrorCheckout(error)),
      });
  }

  campoTieneError(campo: keyof typeof this.formulario.controls): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.dirty || control.touched);
  }

  private cargarDatosIniciales(): void {
    if (this.route.snapshot.routeConfig?.path === 'carrito') {
      this.cargarDatosParaCarrito();
      return;
    }

    const idProducto = Number(this.route.snapshot.paramMap.get('idProducto'));

    if (!Number.isInteger(idProducto) || idProducto <= 0) {
      this.router.navigateByUrl('/catalogo');
      return;
    }

    forkJoin({
      producto: this.productoApiService.obtenerProductoPorId(idProducto),
      tiposEntrega: this.tipoEntregaApiService.obtenerTiposEntrega(),
      // Las opciones de pago son protegidas; sin sesion se evita un 401 innecesario en consola.
      opcionesPago: this.obtenerOpcionesPagoSiHaySesion(),
    })
      .pipe(
        finalize(() => this.cargandoDatos.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ producto, tiposEntrega, opcionesPago }) => {
          this.producto.set(producto);
          this.itemsSolicitud.set([this.mapearProductoAItemCheckout(producto, 1)]);
          this.tiposEntrega.set(tiposEntrega);
          this.opcionesPago.set(opcionesPago);
          this.aplicarValoresIniciales(tiposEntrega, opcionesPago, producto);
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeErrorCheckout(error)),
      });
  }

  private cargarDatosParaCarrito(): void {
    const itemsCarrito = this.carritoCheckout.items();

    if (itemsCarrito.length === 0) {
      this.router.navigateByUrl('/carrito');
      return;
    }

    this.usaCarrito.set(true);
    this.itemsSolicitud.set(itemsCarrito);

    forkJoin({
      tiposEntrega: this.tipoEntregaApiService.obtenerTiposEntrega(),
      // El usuario puede revisar el carrito sin login; el pago se carga recien con sesion activa.
      opcionesPago: this.obtenerOpcionesPagoSiHaySesion(),
    })
      .pipe(
        finalize(() => this.cargandoDatos.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ tiposEntrega, opcionesPago }) => {
          this.tiposEntrega.set(tiposEntrega);
          this.opcionesPago.set(opcionesPago);
          this.aplicarValoresInicialesCheckout(tiposEntrega, opcionesPago);
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeErrorCheckout(error)),
      });
  }

  private aplicarValoresIniciales(
    tiposEntrega: TipoEntrega[],
    opcionesPago: OpcionPagoInicial[],
    producto: Producto,
  ): void {
    this.formulario.controls.idTipoEntrega.setValue(tiposEntrega[0]?.idTipoEntrega ?? null);
    this.formulario.controls.codigoTipoPago.setValue(opcionesPago[0]?.codigo ?? '');
    this.formulario.controls.cantidad.addValidators(Validators.max(producto.stock));
    // En compra directa la observacion reemplaza la personalizacion por item del carrito.
    this.formulario.controls.observacion.addValidators(Validators.required);
    this.formulario.controls.cantidad.updateValueAndValidity();
    this.formulario.controls.observacion.updateValueAndValidity();
  }

  private aplicarValoresInicialesCheckout(
    tiposEntrega: TipoEntrega[],
    opcionesPago: OpcionPagoInicial[],
  ): void {
    this.formulario.controls.idTipoEntrega.setValue(tiposEntrega[0]?.idTipoEntrega ?? null);
    this.formulario.controls.codigoTipoPago.setValue(opcionesPago[0]?.codigo ?? '');
  }

  private obtenerOpcionesPagoSiHaySesion() {
    if (this.requiereLogin()) return of([] as OpcionPagoInicial[]);

    return this.checkoutApiService.obtenerOpcionesPagoInicial();
  }

  private sincronizarFormularioConSignals(): void {
    this.formulario.controls.cantidad.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cantidad) => this.cantidadSeleccionada.set(cantidad));
  }

  private obtenerItemsParaCheckout(): ItemCarrito[] {
    if (this.usaCarrito()) return this.itemsSolicitud();

    const productoActual = this.producto();
    if (!productoActual) return [];

    return [
      this.mapearProductoAItemCheckout(productoActual, this.formulario.controls.cantidad.value),
    ];
  }

  private mapearProductoAItemCheckout(producto: Producto, cantidad: number): ItemCarrito {
    return {
      idProducto: producto.idProducto,
      idTienda: producto.idTienda,
      nombre: producto.nombre,
      nombreTienda: producto.nombreTienda,
      tipoProducto: producto.tipoProducto,
      precioUnitario: producto.precio,
      cantidad,
      stockDisponible: producto.stock,
      urlImagen: producto.imagenes[0]?.urlImagen ?? '/assets/brand/producto-fallback.svg',
      observacion: null,
    };
  }

  private todosLosItemsSonDeLaMismaTienda(items: ItemCarrito[]): boolean {
    return new Set(items.map((item) => item.idTienda)).size === 1;
  }

  private construirObservacionCheckout(
    observacionGeneral: string,
    items: ItemCarrito[],
  ): string | null {
    const observacionesItems = items
      .filter((item) => Boolean(item.observacion))
      .map((item) => `${item.nombre}: ${item.observacion}`);

    const partes = [observacionGeneral.trim(), ...observacionesItems].filter(Boolean);

    // El backend recibe una observacion global; aqui consolidamos notas por item sin cambiar su contrato.
    return partes.length > 0 ? partes.join('\n') : null;
  }

  private obtenerFechaMinimaEntrega(): string {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 1);
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private enfocarPrimerCampoInvalido(): void {
    queueMicrotask(() =>
      this.documento
        .querySelector<HTMLElement>('.solicitud-checkout__formulario [aria-invalid="true"]')
        ?.focus(),
    );
  }

  private obtenerMensajeErrorCheckout(error: unknown): string {
    return obtenerMensajeErrorUsuario(error, 'No pudimos preparar tu compra. Inténtalo nuevamente.');
  }
}

function fechaNoAnteriorA(fechaMinima: string): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const fecha = control.value;
    return fecha && fecha >= fechaMinima ? null : { fechaMinima: true };
  };
}
