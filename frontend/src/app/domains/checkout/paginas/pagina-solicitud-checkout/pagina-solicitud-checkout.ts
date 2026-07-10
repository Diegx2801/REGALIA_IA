import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { SesionAutenticacionService } from '../../../../core/autenticacion/sesion-autenticacion.service';
import { ProductoApiService } from '../../../catalogo/acceso-datos/producto-api.service';
import { Producto } from '../../../catalogo/modelos/producto.model';
import { TipoEntregaApiService } from '../../../datos-maestros/acceso-datos/tipo-entrega-api.service';
import { TipoEntrega } from '../../../datos-maestros/modelos/tipo-entrega.model';
import { CheckoutApiService } from '../../acceso-datos/checkout-api.service';
import { ItemCarrito } from '../../../../core/carrito/carrito.model';
import { OpcionPagoInicial, ResultadoCheckout } from '../../modelos/checkout.model';
import { CarritoCheckoutService } from '../../../../core/carrito/carrito-checkout.service';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import {
  CampoFormularioDirective,
  ErrorCampoDirective,
  FormularioPanelDirective,
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
    FormularioPanelDirective,
  ],
  templateUrl: './pagina-solicitud-checkout.html',
  styleUrl: './pagina-solicitud-checkout.css',
})
export class PaginaSolicitudCheckout implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
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
  readonly resultadoCheckout = signal<ResultadoCheckout | null>(null);
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
      validators: [Validators.required],
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
  readonly requiereObservacionGeneral = computed(() => !this.usaCarrito());
  readonly cantidadItemsSolicitud = computed(() =>
    this.itemsSolicitud().reduce((total, item) => total + item.cantidad, 0),
  );

  ngOnInit(): void {
    this.sincronizarFormularioConSignals();
    this.cargarDatosIniciales();
  }

  prepararCheckout(): void {
    this.mensajeError.set(null);
    this.resultadoCheckout.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    if (this.requiereLogin()) {
      this.mensajeError.set('Inicia sesion como cliente para preparar el pago de tu solicitud.');
      return;
    }

    const items = this.obtenerItemsParaCheckout();
    const valorFormulario = this.formulario.getRawValue();

    if (items.length === 0 || valorFormulario.idTipoEntrega === null) {
      this.mensajeError.set('Faltan productos o datos de entrega para preparar el checkout.');
      return;
    }

    if (!this.todosLosItemsSonDeLaMismaTienda(items)) {
      this.mensajeError.set('El checkout solo puede prepararse con productos de una misma tienda.');
      return;
    }

    this.enviandoSolicitud.set(true);

    // El backend calcula montos, valida stock y prepara la pasarela; el frontend envia la intencion.
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
      .pipe(finalize(() => this.enviandoSolicitud.set(false)))
      .subscribe({
        next: (resultado) => this.resultadoCheckout.set(resultado),
        error: (error: Error) => this.mensajeError.set(this.obtenerMensajeErrorCheckout(error)),
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
      opcionesPago: this.checkoutApiService.obtenerOpcionesPagoInicial(),
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
        error: (error: Error) => this.mensajeError.set(this.obtenerMensajeErrorCheckout(error)),
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
      opcionesPago: this.checkoutApiService.obtenerOpcionesPagoInicial(),
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
        error: (error: Error) => this.mensajeError.set(this.obtenerMensajeErrorCheckout(error)),
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

  private sincronizarFormularioConSignals(): void {
    this.formulario.controls.cantidad.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cantidad) => this.cantidadSeleccionada.set(cantidad));
  }

  private obtenerItemsParaCheckout(): ItemCarrito[] {
    if (this.usaCarrito()) return this.itemsSolicitud();

    const productoActual = this.producto();
    if (!productoActual) return [];

    return [this.mapearProductoAItemCheckout(productoActual, this.formulario.controls.cantidad.value)];
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

  private construirObservacionCheckout(observacionGeneral: string, items: ItemCarrito[]): string | null {
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
    return fecha.toISOString().slice(0, 10);
  }

  private obtenerMensajeErrorCheckout(error: Error): string {
    const mensaje = error.message ?? '';
    const esErrorTecnico =
      mensaje.includes('Http failure response') ||
      mensaje.includes('Unknown Error') ||
      mensaje.includes('Timeout');

    return esErrorTecnico
      ? 'No pudimos conectar con el backend de REGALIA para preparar la solicitud.'
      : mensaje || 'No pudimos preparar la solicitud de checkout.';
  }
}
