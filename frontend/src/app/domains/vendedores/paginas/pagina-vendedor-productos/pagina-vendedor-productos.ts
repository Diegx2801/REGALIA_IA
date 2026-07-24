import { CurrencyPipe, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
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
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { catchError, concatMap, EMPTY, finalize, from, of, switchMap, tap } from 'rxjs';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import {
  CampoFormularioDirective,
  ErrorCampoDirective,
} from '../../../../shared/directivas/formulario-panel.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { InsigniaUi } from '../../../../shared/ui/insignia-ui/insignia-ui';
import { GestorImagenesProductoComponent } from '../../componentes/gestor-imagenes-producto/gestor-imagenes-producto';
import {
  ImagenProductoPendiente,
  SelectorImagenesProductoComponent,
} from '../../componentes/selector-imagenes-producto/selector-imagenes-producto';
import { CargaImagenProductoService } from '../../acceso-datos/carga-imagen-producto.service';
import { VendedorApiService } from '../../acceso-datos/vendedor-api.service';
import { VendedorPanelStore } from '../../estado/vendedor-panel.store';
import { ImagenProductoVendedor, ProductoVendedor } from '../../modelos/vendedor.model';

const PRECIO_MAXIMO = 99_999_999.99;
const STOCK_MAXIMO = 2_147_483_647;

interface ContextoRutaProducto {
  idTienda: number;
  idProducto: number | null;
}

interface ImagenVistaPrevia {
  idVistaPrevia: string;
  url: string;
  orden: number;
}

const textoNoVacio: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim().length === 0
    ? { textoVacio: true }
    : null;

const numeroEntero: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (control.value === null || control.value === '') return null;
  return Number.isInteger(Number(control.value)) ? null : { numeroEntero: true };
};

const maximoDosDecimales: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (control.value === null || control.value === '') return null;
  const valor = Number(control.value);
  return Number.isFinite(valor) && Number(valor.toFixed(2)) === valor
    ? null
    : { maximoDosDecimales: true };
};

/** Editor de catálogo conectado únicamente a los contratos reales del vendedor. */
@Component({
  selector: 'app-pagina-vendedor-productos',
  imports: [
    CurrencyPipe,
    RouterLink,
    ReactiveFormsModule,
    BotonDirective,
    CampoFormularioDirective,
    ErrorCampoDirective,
    EstadoPantallaComponent,
    InsigniaUi,
    GestorImagenesProductoComponent,
    SelectorImagenesProductoComponent,
  ],
  templateUrl: './pagina-vendedor-productos.html',
  styleUrl: './pagina-vendedor-productos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaVendedorProductos implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly vendedorApi = inject(VendedorApiService);
  private readonly cargaImagenProducto = inject(CargaImagenProductoService);
  private readonly revisionFormulario = signal(0);
  private readonly indicesImagenNoDisponible = signal<ReadonlySet<number>>(new Set());
  private secuenciaCargaProducto = 0;
  private componenteActivo = true;

  readonly store = inject(VendedorPanelStore);
  readonly idTienda = signal<number | null>(null);
  readonly idProducto = signal<number | null>(null);
  readonly cargandoProducto = signal(false);
  readonly mensajeErrorCargaProducto = signal<string | null>(null);
  readonly formularioEnviado = signal(false);
  readonly indiceImagenSeleccionada = signal(0);
  readonly tipoProductoOriginal = signal<{ idTipoProducto: number; nombre: string } | null>(null);
  readonly imagenesProducto = signal<ImagenProductoVendedor[]>([]);
  readonly imagenesPendientes = signal<ImagenProductoPendiente[]>([]);
  readonly cargandoImagenesIniciales = signal(false);
  readonly mensajeCargaImagenesIniciales = signal<string | null>(null);

  readonly formularioProducto = new FormGroup({
    idTipoProducto: new FormControl<number | null>(null, [Validators.required]),
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, textoNoVacio, Validators.maxLength(150)],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(1000)],
    }),
    precio: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      Validators.max(PRECIO_MAXIMO),
      maximoDosDecimales,
    ]),
    stock: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(STOCK_MAXIMO),
      numeroEntero,
    ]),
    visibleEnTienda: new FormControl(true, { nonNullable: true }),
  });

  readonly esEdicion = computed(() => this.idProducto() !== null);
  readonly guardandoFormulario = computed(
    () => this.store.guardandoProducto() || this.cargandoImagenesIniciales(),
  );
  readonly tienda = computed(() => {
    const idTienda = this.idTienda();
    return this.store.tiendas().find((tienda) => tienda.idTienda === idTienda) ?? null;
  });

  readonly tiposProductoFormulario = computed(() => {
    const tipos = this.store.tiposProducto();
    const original = this.tipoProductoOriginal();
    if (!original || tipos.some((tipo) => tipo.idTipoProducto === original.idTipoProducto)) {
      return tipos;
    }

    return [
      ...tipos,
      {
        idTipoProducto: original.idTipoProducto,
        nombre: `${original.nombre} (no disponible)`,
        estado: false,
      },
    ];
  });

  readonly nombreVistaPrevia = computed(() => {
    this.revisionFormulario();
    return this.formularioProducto.controls.nombre.value.trim() || 'Nombre de tu producto';
  });

  readonly descripcionVistaPrevia = computed(() => {
    this.revisionFormulario();
    return (
      this.formularioProducto.controls.descripcion.value.trim() ||
      'Agrega una descripción breve para ayudar al cliente a elegir.'
    );
  });

  readonly tipoVistaPrevia = computed(() => {
    this.revisionFormulario();
    const idTipoProducto = this.formularioProducto.controls.idTipoProducto.value;
    return (
      this.tiposProductoFormulario()
        .find((tipo) => tipo.idTipoProducto === idTipoProducto)
        ?.nombre.replace(' (no disponible)', '') ?? 'Tipo de producto'
    );
  });

  readonly precioVistaPrevia = computed(() => {
    this.revisionFormulario();
    return Math.max(Number(this.formularioProducto.controls.precio.value ?? 0), 0);
  });

  readonly stockVistaPrevia = computed(() => {
    this.revisionFormulario();
    return Math.max(Math.trunc(Number(this.formularioProducto.controls.stock.value ?? 0)), 0);
  });

  readonly visibleVistaPrevia = computed(() => {
    this.revisionFormulario();
    return this.formularioProducto.controls.visibleEnTienda.value;
  });

  readonly estadoCatalogoVistaPrevia = computed(() => {
    if (!this.visibleVistaPrevia()) return { texto: 'Oculto', variante: 'neutral' as const };
    if (this.stockVistaPrevia() === 0) {
      return { texto: 'Sin stock', variante: 'advertencia' as const };
    }
    return { texto: 'Visible', variante: 'exito' as const };
  });

  readonly imagenesVistaPrevia = computed<ImagenVistaPrevia[]>(() => {
    const imagenesPersistidas = this.imagenesProducto().map((imagen) => ({
      idVistaPrevia: `persistida-${imagen.idProductoImagen}`,
      url: imagen.urlImagen,
      orden: imagen.orden,
    }));
    const ordenInicial = imagenesPersistidas.length;
    const imagenesPendientes = this.imagenesPendientes().map((imagen, indice) => ({
      idVistaPrevia: `pendiente-${imagen.idLocal}`,
      url: imagen.urlVistaPrevia,
      orden: ordenInicial + indice + 1,
    }));

    return [...imagenesPersistidas, ...imagenesPendientes];
  });

  readonly imagenSeleccionada = computed(() => {
    const imagenes = this.imagenesVistaPrevia();
    return (
      imagenes.find((imagen) => imagen.orden - 1 === this.indiceImagenSeleccionada()) ??
      imagenes[0] ??
      null
    );
  });

  readonly cantidadErrores = computed(() => {
    this.revisionFormulario();
    const controlesPrincipales = [
      this.formularioProducto.controls.idTipoProducto,
      this.formularioProducto.controls.nombre,
      this.formularioProducto.controls.descripcion,
      this.formularioProducto.controls.precio,
      this.formularioProducto.controls.stock,
    ];
    return (
      controlesPrincipales.filter((control) => control.invalid).length
    );
  });

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => {
      this.componenteActivo = false;
      this.secuenciaCargaProducto += 1;
      this.limpiarImagenesPendientes();
    });
    this.store.limpiarMensajes();
    this.formularioProducto.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.revisionFormulario.update((revision) => revision + 1));

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const contexto = this.obtenerContextoRuta(params);
          if (!contexto) {
            void this.router.navigate(['/vendedor/tiendas'], { replaceUrl: true });
            return EMPTY;
          }

          this.prepararContexto(contexto);
          if (contexto.idProducto === null) return of(null);

          const idSolicitud = ++this.secuenciaCargaProducto;
          this.cargandoProducto.set(true);
          return this.vendedorApi.obtenerProductoPorId(contexto.idTienda, contexto.idProducto).pipe(
            tap((producto) => {
              if (this.esCargaProductoActual(idSolicitud, contexto)) {
                this.cargarFormulario(producto);
              }
            }),
            catchError(() => {
              if (this.esCargaProductoActual(idSolicitud, contexto)) {
                this.mensajeErrorCargaProducto.set('No pudimos cargar el producto solicitado.');
              }
              return EMPTY;
            }),
            finalize(() => {
              if (this.esCargaProductoActual(idSolicitud, contexto)) {
                this.cargandoProducto.set(false);
              }
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  @HostListener('window:beforeunload', ['$event'])
  advertirCambiosAntesDeCerrar(evento: BeforeUnloadEvent): void {
    if (!this.hayCambiosPendientes()) return;
    evento.preventDefault();
    evento.returnValue = '';
  }

  confirmarSalida(): boolean {
    if (!this.hayCambiosPendientes()) return true;
    return window.confirm(
      'Tienes cambios sin guardar. Si sales ahora, se perderán. ¿Deseas continuar?',
    );
  }

  guardarProducto(): void {
    if (this.guardandoFormulario() || this.store.tiposProducto().length === 0) return;

    this.store.limpiarMensajes();
    this.formularioEnviado.set(true);
    this.validarTipoProductoDisponible();

    if (this.formularioProducto.invalid) {
      this.formularioProducto.markAllAsTouched();
      this.revisionFormulario.update((revision) => revision + 1);
      this.enfocarPrimerCampoInvalido();
      return;
    }

    const idTienda = this.idTienda();
    const idProducto = this.idProducto();
    const valor = this.formularioProducto.getRawValue();
    if (
      idTienda === null ||
      valor.idTipoProducto === null ||
      valor.precio === null ||
      valor.stock === null
    ) {
      return;
    }

    this.formularioEnviado.set(false);
    const revisionGuardada = this.revisionFormulario();
    this.store.guardarProducto(
      idTienda,
      {
        idTipoProducto: valor.idTipoProducto,
        nombre: valor.nombre.trim(),
        descripcion: valor.descripcion.trim() || null,
        precio: Number(valor.precio),
        stock: Number(valor.stock),
        visibleEnTienda: valor.visibleEnTienda,
      },
      idProducto ?? undefined,
      (producto) => {
        if (
          !this.componenteActivo ||
          this.idTienda() !== idTienda ||
          this.idProducto() !== idProducto ||
          this.revisionFormulario() !== revisionGuardada
        ) {
          return;
        }
        this.formularioProducto.markAsPristine();
        if (idProducto === null) {
          this.idProducto.set(producto.idProducto);
          this.actualizarImagenesProducto(producto.imagenes);
          this.location.replaceState(
            `/vendedor/tiendas/${idTienda}/productos/${producto.idProducto}/editar`,
          );
          this.cargarImagenesIniciales(idTienda, producto.idProducto);
        }
      },
    );
  }

  actualizarImagenesProducto(imagenes: ImagenProductoVendedor[]): void {
    this.imagenesProducto.set(imagenes);
    this.indiceImagenSeleccionada.set(0);
    this.indicesImagenNoDisponible.set(new Set());
  }

  agregarImagenesPendientes(imagenes: ImagenProductoPendiente[]): void {
    this.imagenesPendientes.update((actuales) => [...actuales, ...imagenes]);
    this.mensajeCargaImagenesIniciales.set(null);
    this.indicesImagenNoDisponible.set(new Set());
  }

  eliminarImagenPendiente(imagen: ImagenProductoPendiente): void {
    URL.revokeObjectURL(imagen.urlVistaPrevia);
    this.imagenesPendientes.update((actuales) =>
      actuales.filter((actual) => actual.idLocal !== imagen.idLocal),
    );
    this.indicesImagenNoDisponible.set(new Set());
  }

  reintentarCargaImagenesIniciales(): void {
    const idTienda = this.idTienda();
    const idProducto = this.idProducto();
    if (idTienda === null || idProducto === null || this.imagenesPendientes().length === 0) return;

    this.cargarImagenesIniciales(idTienda, idProducto);
  }

  seleccionarImagen(indice: number): void {
    this.indiceImagenSeleccionada.set(indice);
  }

  marcarImagenNoDisponible(indice: number): void {
    this.indicesImagenNoDisponible.update((indices) => new Set(indices).add(indice));
  }

  imagenNoDisponible(indice: number): boolean {
    return this.indicesImagenNoDisponible().has(indice);
  }

  campoTieneError(
    campo: Exclude<keyof typeof this.formularioProducto.controls, 'imagenes'>,
  ): boolean {
    const control = this.formularioProducto.controls[campo];
    return control.invalid && (control.touched || control.dirty || this.formularioEnviado());
  }

  mensajeErrorTipoProducto(): string {
    const control = this.formularioProducto.controls.idTipoProducto;
    return control.hasError('tipoNoDisponible')
      ? 'El tipo actual ya no está disponible. Selecciona otro para continuar.'
      : 'Selecciona un tipo de producto.';
  }

  mensajeErrorNombre(): string {
    const control = this.formularioProducto.controls.nombre;
    if (control.hasError('maxlength')) return 'El nombre no puede superar los 150 caracteres.';
    return 'Escribe un nombre con contenido para el producto.';
  }

  mensajeErrorPrecio(): string {
    const control = this.formularioProducto.controls.precio;
    if (control.hasError('max')) return 'El precio supera el máximo permitido.';
    if (control.hasError('maximoDosDecimales')) return 'Usa como máximo dos decimales.';
    return 'Ingresa un precio mayor o igual a S/ 0.01.';
  }

  mensajeErrorStock(): string {
    const control = this.formularioProducto.controls.stock;
    if (control.hasError('numeroEntero')) return 'El stock debe ser un número entero.';
    if (control.hasError('max')) return 'El stock supera el máximo permitido.';
    return 'Ingresa una cantidad igual o mayor a cero.';
  }

  reintentarCargaProducto(): void {
    const idTienda = this.idTienda();
    const idProducto = this.idProducto();
    if (idTienda === null || idProducto === null) return;

    const contexto = { idTienda, idProducto };
    const idSolicitud = ++this.secuenciaCargaProducto;
    this.mensajeErrorCargaProducto.set(null);
    this.cargandoProducto.set(true);
    this.vendedorApi
      .obtenerProductoPorId(idTienda, idProducto)
      .pipe(
        finalize(() => {
          if (this.esCargaProductoActual(idSolicitud, contexto)) {
            this.cargandoProducto.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (producto) => {
          if (this.esCargaProductoActual(idSolicitud, contexto)) {
            this.cargarFormulario(producto);
          }
        },
        error: () => {
          if (this.esCargaProductoActual(idSolicitud, contexto)) {
            this.mensajeErrorCargaProducto.set('No pudimos cargar el producto solicitado.');
          }
        },
      });
  }

  cancelar(): void {
    if (this.guardandoFormulario()) return;
    const idTienda = this.idTienda();
    this.limpiarImagenesPendientes();
    if (idTienda !== null) void this.router.navigate(['/vendedor/tiendas', idTienda]);
  }

  private obtenerContextoRuta(params: ParamMap): ContextoRutaProducto | null {
    const idTienda = Number(params.get('idTienda'));
    if (!Number.isInteger(idTienda) || idTienda <= 0) return null;

    const parametroProducto = params.get('idProducto');
    if (parametroProducto === null) return { idTienda, idProducto: null };

    const idProducto = Number(parametroProducto);
    return Number.isInteger(idProducto) && idProducto > 0 ? { idTienda, idProducto } : null;
  }

  private prepararContexto(contexto: ContextoRutaProducto): void {
    this.secuenciaCargaProducto += 1;
    this.idTienda.set(contexto.idTienda);
    this.idProducto.set(contexto.idProducto);
    this.mensajeErrorCargaProducto.set(null);
    this.cargandoProducto.set(false);
    this.tipoProductoOriginal.set(null);
    this.indicesImagenNoDisponible.set(new Set());
    this.indiceImagenSeleccionada.set(0);
    this.reiniciarFormulario();
    this.store.cargarContexto();
  }

  private reiniciarFormulario(): void {
    this.limpiarImagenesPendientes();
    this.formularioProducto.reset({
      idTipoProducto: null,
      nombre: '',
      descripcion: '',
      precio: null,
      stock: null,
      visibleEnTienda: true,
    });
    this.imagenesProducto.set([]);
    this.formularioEnviado.set(false);
    this.formularioProducto.markAsPristine();
    this.formularioProducto.markAsUntouched();
  }

  private cargarFormulario(producto: ProductoVendedor): void {
    this.mensajeErrorCargaProducto.set(null);
    this.tipoProductoOriginal.set({
      idTipoProducto: producto.idTipoProducto,
      nombre: producto.tipoProducto,
    });
    this.formularioProducto.reset({
      idTipoProducto: producto.idTipoProducto,
      nombre: producto.nombre,
      descripcion:
        producto.descripcion === 'Sin descripcion registrada.' ? '' : producto.descripcion,
      precio: producto.precio,
      stock: producto.stock,
      visibleEnTienda: producto.visibleEnTienda,
    });
    this.imagenesProducto.set(producto.imagenes);
    this.formularioProducto.markAsPristine();
    this.formularioProducto.markAsUntouched();
  }

  private validarTipoProductoDisponible(): void {
    const control = this.formularioProducto.controls.idTipoProducto;
    const idTipoProducto = control.value;
    const estaDisponible =
      idTipoProducto !== null &&
      this.store.tiposProducto().some((tipo) => tipo.idTipoProducto === idTipoProducto);

    if (idTipoProducto !== null && !estaDisponible) {
      control.setErrors({ ...(control.errors ?? {}), tipoNoDisponible: true });
      return;
    }

    if (!control.hasError('tipoNoDisponible')) return;
    const otrosErrores = { ...(control.errors ?? {}) };
    delete otrosErrores['tipoNoDisponible'];
    control.setErrors(Object.keys(otrosErrores).length > 0 ? otrosErrores : null);
  }

  private enfocarPrimerCampoInvalido(): void {
    const campos: Array<{ control: AbstractControl; id: string }> = [
      { control: this.formularioProducto.controls.idTipoProducto, id: 'producto-tipo' },
      { control: this.formularioProducto.controls.nombre, id: 'producto-nombre' },
      { control: this.formularioProducto.controls.descripcion, id: 'producto-descripcion' },
      { control: this.formularioProducto.controls.precio, id: 'producto-precio' },
      { control: this.formularioProducto.controls.stock, id: 'producto-stock' },
    ];
    const primerCampo = campos.find(({ control }) => control.invalid);
    if (!primerCampo) return;

    queueMicrotask(() =>
      this.elemento.nativeElement.querySelector<HTMLElement>(`#${primerCampo.id}`)?.focus(),
    );
  }

  private esCargaProductoActual(idSolicitud: number, contexto: ContextoRutaProducto): boolean {
    return (
      this.componenteActivo &&
      idSolicitud === this.secuenciaCargaProducto &&
      this.idTienda() === contexto.idTienda &&
      this.idProducto() === contexto.idProducto
    );
  }

  private hayCambiosPendientes(): boolean {
    return this.formularioProducto.dirty || this.imagenesPendientes().length > 0;
  }

  private cargarImagenesIniciales(idTienda: number, idProducto: number): void {
    const pendientes = [...this.imagenesPendientes()];
    if (pendientes.length === 0) return;

    this.cargandoImagenesIniciales.set(true);
    this.mensajeCargaImagenesIniciales.set('Estamos agregando tus imágenes al producto.');

    from(pendientes)
      .pipe(
        concatMap((imagenPendiente) =>
          this.cargaImagenProducto.cargarArchivo(idTienda, idProducto, imagenPendiente.archivo).pipe(
            tap((imagen) => {
              this.actualizarImagenesProducto([...this.imagenesProducto(), imagen]);
              this.eliminarImagenPendiente(imagenPendiente);
            }),
          ),
        ),
        finalize(() => this.cargandoImagenesIniciales.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        complete: () => this.mensajeCargaImagenesIniciales.set('Producto creado e imágenes agregadas correctamente.'),
        error: () => {
          const faltantes = this.imagenesPendientes().length;
          this.mensajeCargaImagenesIniciales.set(
            faltantes === 1
              ? 'El producto fue creado, pero queda 1 imagen por cargar. Puedes reintentarla.'
              : `El producto fue creado, pero quedan ${faltantes} imágenes por cargar. Puedes reintentarlas.`,
          );
        },
      });
  }

  private limpiarImagenesPendientes(): void {
    this.imagenesPendientes().forEach((imagen) => URL.revokeObjectURL(imagen.urlVistaPrevia));
    this.imagenesPendientes.set([]);
  }
}
