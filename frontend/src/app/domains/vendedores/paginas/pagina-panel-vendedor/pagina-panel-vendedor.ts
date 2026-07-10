import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin, of, switchMap } from 'rxjs';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import {
  CampoFormularioDirective,
  ErrorCampoDirective,
  FormularioPanelDirective,
} from '../../../../shared/directivas/formulario-panel.directive';
import { RubroApiService } from '../../../datos-maestros/acceso-datos/rubro-api.service';
import { TipoProductoApiService } from '../../../datos-maestros/acceso-datos/tipo-producto-api.service';
import { Rubro } from '../../../datos-maestros/modelos/rubro.model';
import { TipoProducto } from '../../../datos-maestros/modelos/tipo-producto.model';
import { confirmarAccionCritica } from '../../../../shared/utilidades/confirmar-accion.util';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { TarjetaMetricaComponent } from '../../../../shared/ui/tarjeta-metrica/tarjeta-metrica';
import { VendedorApiService } from '../../acceso-datos/vendedor-api.service';
import {
  PedidoRecibidoDetalle,
  PedidoRecibidoResumen,
  ProductoVendedor,
  TiendaVendedor,
  VendedorPerfil,
} from '../../modelos/vendedor.model';

@Component({
  selector: 'app-pagina-panel-vendedor',
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    BotonDirective,
    CampoFormularioDirective,
    ErrorCampoDirective,
    FormularioPanelDirective,
    EstadoPantallaComponent,
    FilaPanelComponent,
    ListaPanelComponent,
    TarjetaMetricaComponent,
  ],
  templateUrl: './pagina-panel-vendedor.html',
  styleUrl: './pagina-panel-vendedor.css',
})
export class PaginaPanelVendedor implements OnInit {
  private readonly vendedorApi = inject(VendedorApiService);
  private readonly rubroApi = inject(RubroApiService);
  private readonly tipoProductoApi = inject(TipoProductoApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly perfil = signal<VendedorPerfil | null>(null);
  readonly tiendas = signal<TiendaVendedor[]>([]);
  readonly productos = signal<ProductoVendedor[]>([]);
  readonly pedidosTodos = signal<PedidoRecibidoResumen[]>([]);
  readonly pedidos = signal<PedidoRecibidoResumen[]>([]);
  readonly pedidoDetalle = signal<PedidoRecibidoDetalle | null>(null);
  readonly rubros = signal<Rubro[]>([]);
  readonly tiposProducto = signal<TipoProducto[]>([]);
  readonly idTiendaSeleccionada = signal<number | null>(null);
  readonly idTiendaPedidosSeleccionada = signal<number | null>(null);
  readonly estadoPedidoSeleccionado = signal('');
  readonly busquedaPedidos = signal('');
  readonly cargando = signal(true);
  readonly cargandoPedidos = signal(false);
  readonly cargandoDetallePedido = signal(false);
  readonly guardandoPerfil = signal(false);
  readonly guardandoTienda = signal(false);
  readonly guardandoProducto = signal(false);
  readonly idProductoEditando = signal<number | null>(null);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly formularioTienda = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(1000)],
    }),
    direccionReferencia: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(255)],
    }),
    idRubro: new FormControl<number | null>(null, [Validators.required]),
  });

  readonly formularioProducto = new FormGroup({
    idTipoProducto: new FormControl<number | null>(null, [Validators.required]),
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(1000)],
    }),
    precio: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)],
    }),
    stock: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    visibleEnTienda: new FormControl(true, { nonNullable: true }),
    urlImagen: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
  });

  readonly tiendaSeleccionada = computed(() =>
    this.tiendas().find((tienda) => tienda.idTienda === this.idTiendaSeleccionada()) ?? null,
  );
  readonly productosVisibles = computed(
    () => this.productos().filter((producto) => producto.visibleEnTienda && producto.estado).length,
  );
  readonly productosSinStock = computed(
    () => this.productos().filter((producto) => producto.stock <= 0).length,
  );
  readonly pedidosPendientes = computed(
    () => this.pedidosTodos().filter((pedido) => pedido.saldoPendiente > 0).length,
  );
  readonly saldoPendiente = computed(() =>
    this.pedidosTodos().reduce((total, pedido) => total + pedido.saldoPendiente, 0),
  );
  readonly totalPagado = computed(() =>
    this.pedidosTodos().reduce((total, pedido) => total + pedido.montoPagado, 0),
  );
  readonly estadosPedidoDisponibles = computed(() =>
    Array.from(new Set(this.pedidos().map((pedido) => pedido.estadoPedido))).sort(),
  );
  readonly pedidosFiltrados = computed(() => {
    const estado = this.estadoPedidoSeleccionado();
    const busqueda = this.busquedaPedidos().trim().toLowerCase();

    // Filtros locales sobre pedidos reales ya consultados; no reemplazan acciones de estado del backend.
    return this.pedidos()
      .filter((pedido) => !estado || pedido.estadoPedido === estado)
      .filter((pedido) => {
        if (!busqueda) return true;
        return (
          pedido.nombreTienda.toLowerCase().includes(busqueda) ||
          pedido.correoCliente.toLowerCase().includes(busqueda) ||
          String(pedido.idPedido).includes(busqueda)
        );
      })
      .slice(0, 8);
  });
  readonly debeCrearPerfil = computed(() =>
    (this.mensajeError() ?? '').toLowerCase().includes('perfil vendedor'),
  );

  ngOnInit(): void {
    this.cargarPanel();
  }

  cargarPanel(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
    this.pedidoDetalle.set(null);

    forkJoin({
      perfil: this.vendedorApi.obtenerPerfilActual(),
      tiendas: this.vendedorApi.obtenerTiendas(),
      pedidos: this.vendedorApi.obtenerPedidosRecibidos(),
      rubros: this.rubroApi.obtenerRubros(),
      tiposProducto: this.tipoProductoApi.obtenerTiposProducto(),
    })
      .pipe(
        switchMap(({ perfil, tiendas, pedidos, rubros, tiposProducto }) => {
          this.perfil.set(perfil);
          this.tiendas.set(tiendas);
          this.pedidosTodos.set(pedidos);
          this.pedidos.set(pedidos);
          this.rubros.set(rubros);
          this.tiposProducto.set(tiposProducto);
          this.formularioTienda.controls.idRubro.setValue(rubros[0]?.idRubro ?? null);
          this.formularioProducto.controls.idTipoProducto.setValue(
            tiposProducto[0]?.idTipoProducto ?? null,
          );

          const primeraTienda = tiendas[0]?.idTienda ?? null;
          this.idTiendaSeleccionada.set(primeraTienda);

          // El panel muestra productos de la tienda activa; las metricas globales salen de pedidos/tiendas.
          return primeraTienda
            ? this.vendedorApi.obtenerProductosPorTienda(primeraTienda)
            : of<ProductoVendedor[]>([]);
        }),
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (productos) => this.productos.set(productos),
        error: (error: Error) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  crearPerfilVendedor(): void {
    this.guardandoPerfil.set(true);
    this.mensajeError.set(null);

    this.vendedorApi
      .crearPerfilVendedor()
      .pipe(
        finalize(() => this.guardandoPerfil.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.mensajeExito.set('Perfil vendedor creado correctamente.');
          this.cargarPanel();
        },
        error: (error: Error) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  seleccionarTienda(idTienda: number): void {
    this.idTiendaSeleccionada.set(idTienda);
    this.productos.set([]);

    this.vendedorApi
      .obtenerProductosPorTienda(idTienda)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (productos) => this.productos.set(productos),
        error: (error: Error) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  filtrarPedidosPorTienda(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value;
    const idTienda = valor ? Number(valor) : null;

    this.idTiendaPedidosSeleccionada.set(idTienda);
    this.pedidoDetalle.set(null);
    this.cargandoPedidos.set(true);
    this.mensajeError.set(null);
    this.estadoPedidoSeleccionado.set('');
    this.busquedaPedidos.set('');

    const consulta = idTienda
      ? this.vendedorApi.obtenerPedidosPorTienda(idTienda)
      : this.vendedorApi.obtenerPedidosRecibidos();

    // El filtro usa endpoints reales del backend; no trabaja con datos simulados.
    consulta
      .pipe(
        finalize(() => this.cargandoPedidos.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pedidos) => {
          this.pedidos.set(pedidos);
          if (idTienda === null) this.pedidosTodos.set(pedidos);
        },
        error: (error: Error) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  filtrarPedidosPorEstado(evento: Event): void {
    this.estadoPedidoSeleccionado.set((evento.target as HTMLSelectElement).value);
  }

  buscarPedidos(evento: Event): void {
    this.busquedaPedidos.set((evento.target as HTMLInputElement).value);
  }

  verDetallePedido(pedido: PedidoRecibidoResumen): void {
    this.pedidoDetalle.set(null);
    this.cargandoDetallePedido.set(true);
    this.mensajeError.set(null);

    this.vendedorApi
      .obtenerDetallePedidoRecibido(pedido.idPedido)
      .pipe(
        finalize(() => this.cargandoDetallePedido.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (detalle) => this.pedidoDetalle.set(detalle),
        error: (error: Error) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  crearTienda(): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    if (this.formularioTienda.invalid) {
      this.formularioTienda.markAllAsTouched();
      return;
    }

    const valor = this.formularioTienda.getRawValue();
    if (valor.idRubro === null) return;

    this.guardandoTienda.set(true);

    // El formulario envia solo el contrato requerido; revision/formalizacion las decide el backend.
    this.vendedorApi
      .crearTienda({
        nombre: valor.nombre.trim(),
        descripcion: valor.descripcion.trim() || null,
        direccionReferencia: valor.direccionReferencia.trim() || null,
        idsRubros: [valor.idRubro],
      })
      .pipe(
        finalize(() => this.guardandoTienda.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.formularioTienda.reset({
            nombre: '',
            descripcion: '',
            direccionReferencia: '',
            idRubro: this.rubros()[0]?.idRubro ?? null,
          });
          this.mensajeExito.set('Tienda creada correctamente.');
          this.cargarPanel();
        },
        error: (error: Error) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  guardarProducto(): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    if (this.formularioProducto.invalid) {
      this.formularioProducto.markAllAsTouched();
      return;
    }

    const idTienda = this.idTiendaSeleccionada();
    const valor = this.formularioProducto.getRawValue();
    if (idTienda === null || valor.idTipoProducto === null) return;

    this.guardandoProducto.set(true);

    const solicitud = {
      idTipoProducto: valor.idTipoProducto,
      nombre: valor.nombre.trim(),
      descripcion: valor.descripcion.trim() || null,
      precio: Number(valor.precio),
      stock: Number(valor.stock),
      visibleEnTienda: valor.visibleEnTienda,
      urlImagen: valor.urlImagen.trim() || null,
    };
    const idProductoEditando = this.idProductoEditando();
    const operacion = idProductoEditando
      ? this.vendedorApi.actualizarProducto(idTienda, idProductoEditando, solicitud)
      : this.vendedorApi.crearProducto(idTienda, solicitud);

    // El producto queda asociado a la tienda activa; no se envia idVendedor desde frontend.
    operacion
      .pipe(
        switchMap(() => this.vendedorApi.obtenerProductosPorTienda(idTienda)),
        finalize(() => this.guardandoProducto.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (productos) => {
          this.productos.set(productos);
          this.formularioProducto.reset({
            idTipoProducto: this.tiposProducto()[0]?.idTipoProducto ?? null,
            nombre: '',
            descripcion: '',
            precio: 0,
            stock: 0,
            visibleEnTienda: true,
            urlImagen: '',
          });
          this.idProductoEditando.set(null);
          this.mensajeExito.set(idProductoEditando ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
        },
        error: (error: Error) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  editarProducto(producto: ProductoVendedor): void {
    const tipoProducto = this.tiposProducto().find((tipo) => tipo.nombre === producto.tipoProducto);

    this.idProductoEditando.set(producto.idProducto);
    this.formularioProducto.reset({
      idTipoProducto: tipoProducto?.idTipoProducto ?? this.tiposProducto()[0]?.idTipoProducto ?? null,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      stock: producto.stock,
      visibleEnTienda: producto.visibleEnTienda,
      urlImagen: producto.urlImagen.includes('producto-fallback.svg') ? '' : producto.urlImagen,
    });
  }

  cancelarEdicionProducto(): void {
    this.idProductoEditando.set(null);
    this.formularioProducto.reset({
      idTipoProducto: this.tiposProducto()[0]?.idTipoProducto ?? null,
      nombre: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      visibleEnTienda: true,
      urlImagen: '',
    });
  }

  desactivarProducto(producto: ProductoVendedor): void {
    const idTienda = this.idTiendaSeleccionada();
    if (idTienda === null) return;

    if (!confirmarAccionCritica(`Vas a desactivar el producto "${producto.nombre}". Esta accion lo ocultara de la tienda.`)) {
      return;
    }

    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    this.vendedorApi
      .desactivarProducto(idTienda, producto.idProducto)
      .pipe(
        switchMap(() => this.vendedorApi.obtenerProductosPorTienda(idTienda)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (productos) => {
          this.productos.set(productos);
          if (this.idProductoEditando() === producto.idProducto) this.cancelarEdicionProducto();
          this.mensajeExito.set('Producto desactivado correctamente.');
        },
        error: (error: Error) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  campoTiendaTieneError(campo: keyof typeof this.formularioTienda.controls): boolean {
    const control = this.formularioTienda.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  campoProductoTieneError(campo: keyof typeof this.formularioProducto.controls): boolean {
    const control = this.formularioProducto.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  private obtenerMensajeError(error: Error): string {
    const mensaje = error.message ?? '';
    const esErrorTecnico =
      mensaje.includes('Http failure response') ||
      mensaje.includes('Unknown Error') ||
      mensaje.includes('Timeout');

    return esErrorTecnico
      ? 'No pudimos conectar con el backend para cargar el panel vendedor.'
      : mensaje || 'No pudimos cargar la informacion del vendedor.';
  }
}
