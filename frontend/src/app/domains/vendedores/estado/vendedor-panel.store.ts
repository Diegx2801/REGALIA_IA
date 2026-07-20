import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin, Subscription } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../core/http/modelos/error-api.model';
import { RubroApiService } from '../../datos-maestros/acceso-datos/rubro-api.service';
import { TipoProductoApiService } from '../../datos-maestros/acceso-datos/tipo-producto-api.service';
import { Rubro } from '../../datos-maestros/modelos/rubro.model';
import { TipoProducto } from '../../datos-maestros/modelos/tipo-producto.model';
import { ConsultaPedidosVendedor, VendedorApiService } from '../acceso-datos/vendedor-api.service';
import {
  PedidoRecibidoDetalle,
  PedidoRecibidoResumen,
  ProductoVendedor,
  SolicitudProductoVendedor,
  SolicitudTiendaVendedor,
  TiendaVendedor,
  VendedorPerfil,
} from '../modelos/vendedor.model';

@Injectable()
export class VendedorPanelStore {
  private readonly vendedorApi = inject(VendedorApiService);
  private readonly rubroApi = inject(RubroApiService);
  private readonly tipoProductoApi = inject(TipoProductoApiService);
  private readonly destroyRef = inject(DestroyRef);
  private contextoCargado = false;
  private resumenPedidosCargado = false;
  private cargaContextoEnCurso = false;
  private cargaResumenPedidosEnCurso = false;
  private cargarInventarioResumenPendiente = false;
  private forzarInventarioResumenPendiente = false;
  private secuenciaCargaInventario = 0;
  private secuenciaCargaPedidos = 0;
  private secuenciaCargaDetallePedido = 0;
  private secuenciaCargaTiendasPedidos = 0;
  private idTiendaInventarioEnCarga: number | null = null;
  private idTiendaCentroEnCarga: number | null = null;
  private suscripcionInventario: Subscription | null = null;
  private suscripcionPedidos: Subscription | null = null;
  private suscripcionDetallePedido: Subscription | null = null;
  private suscripcionTiendasPedidos: Subscription | null = null;
  private tiendasPedidosCargadas = false;

  private readonly cargandoContexto = signal(false);
  private readonly cargandoResumenPedidos = signal(false);
  private readonly idTiendaInventarioInterno = signal<number | null>(null);

  readonly perfil = signal<VendedorPerfil | null>(null);
  readonly tiendas = signal<TiendaVendedor[]>([]);
  readonly productos = signal<ProductoVendedor[]>([]);
  readonly pedidosTodos = signal<PedidoRecibidoResumen[]>([]);
  readonly pedidos = signal<PedidoRecibidoResumen[]>([]);
  readonly paginaPedidosActual = signal(0);
  readonly tamanioPaginaPedidos = signal(10);
  readonly totalPedidos = signal(0);
  readonly totalPaginasPedidos = signal(0);
  readonly ultimaPaginaPedidos = signal(true);
  readonly pedidoDetalle = signal<PedidoRecibidoDetalle | null>(null);
  readonly idPedidoSeleccionado = signal<number | null>(null);
  readonly rubros = signal<Rubro[]>([]);
  readonly tiposProducto = signal<TipoProducto[]>([]);
  readonly idTiendaSeleccionada = signal<number | null>(null);
  readonly idTiendaPedidosSeleccionada = signal<number | null>(null);
  readonly cargando = computed(
    () => this.cargandoContexto() || this.cargandoResumenPedidos() || this.cargandoProductos(),
  );
  readonly cargandoProductos = signal(false);
  readonly cargandoPedidos = signal(false);
  readonly cargandoDetallePedido = signal(false);
  readonly cargandoTiendasPedidos = signal(false);
  readonly guardandoPerfil = signal(false);
  readonly guardandoTienda = signal(false);
  readonly cargandoTienda = signal<number | null>(null);
  readonly eliminandoTienda = signal<number | null>(null);
  readonly guardandoProducto = signal(false);
  readonly desactivandoProducto = signal<number | null>(null);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeErrorPedidos = signal<string | null>(null);
  readonly mensajeErrorDetallePedido = signal<string | null>(null);
  readonly mensajeErrorTiendasPedidos = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);
  readonly idTiendaInventario = this.idTiendaInventarioInterno.asReadonly();

  readonly tiendaSeleccionada = computed(
    () => this.tiendas().find((tienda) => tienda.idTienda === this.idTiendaSeleccionada()) ?? null,
  );
  readonly inventarioListo = computed(() => {
    const idTienda = this.idTiendaSeleccionada();
    return (
      idTienda !== null &&
      this.idTiendaInventarioInterno() === idTienda &&
      !this.cargandoProductos()
    );
  });
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
  readonly pedidosRecientes = computed(() => this.pedidosTodos().slice(0, 5));
  readonly tiendasPendientesRevision = computed(
    () => this.tiendas().filter((tienda) => tienda.estadoRevision !== 'APROBADA').length,
  );
  readonly debeCrearPerfil = computed(() =>
    (this.mensajeError() ?? '').toLowerCase().includes('perfil vendedor'),
  );

  cargarPanel(forzar = false): void {
    this.cargarInventarioResumenPendiente = true;
    this.forzarInventarioResumenPendiente ||= forzar;
    this.cargarContexto(forzar);
    this.cargarResumenPedidos(forzar);
    this.procesarInventarioResumenPendiente();
  }

  cargarContexto(forzar = false): void {
    if (this.cargaContextoEnCurso || (this.contextoCargado && !forzar)) return;

    if (forzar) {
      this.contextoCargado = false;
      this.invalidarInventario();
    }
    this.cargaContextoEnCurso = true;
    this.cargandoContexto.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    forkJoin({
      perfil: this.vendedorApi.obtenerPerfilActual(),
      tiendas: this.vendedorApi.obtenerTiendas(),
      rubros: this.rubroApi.obtenerRubros(),
      tiposProducto: this.tipoProductoApi.obtenerTiposProducto(),
    })
      .pipe(
        finalize(() => {
          this.cargaContextoEnCurso = false;
          this.cargandoContexto.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ perfil, tiendas, rubros, tiposProducto }) => {
          this.perfil.set(perfil);
          this.tiendas.set(tiendas);
          this.tiendasPedidosCargadas = true;
          this.mensajeErrorTiendasPedidos.set(null);
          this.rubros.set(rubros);
          this.tiposProducto.set(tiposProducto);
          this.contextoCargado = true;

          const idSeleccionado = this.idTiendaSeleccionada();
          if (
            idSeleccionado !== null &&
            !tiendas.some((tienda) => tienda.idTienda === idSeleccionado)
          ) {
            this.limpiarInventario();
          }

          this.procesarInventarioResumenPendiente();
        },
        error: (error: unknown) => {
          this.contextoCargado = false;
          this.mensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private cargarResumenPedidos(forzar = false): void {
    if (this.cargaResumenPedidosEnCurso || (this.resumenPedidosCargado && !forzar)) {
      return;
    }

    if (forzar) this.resumenPedidosCargado = false;
    this.cargaResumenPedidosEnCurso = true;
    this.cargandoResumenPedidos.set(true);

    this.vendedorApi
      .obtenerPedidosRecibidos({ page: 0, size: 5 })
      .pipe(
        finalize(() => {
          this.cargaResumenPedidosEnCurso = false;
          this.cargandoResumenPedidos.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pagina) => {
          this.pedidosTodos.set(pagina.contenido);
          this.resumenPedidosCargado = true;
        },
        error: (error: unknown) => {
          this.resumenPedidosCargado = false;
          this.mensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private procesarInventarioResumenPendiente(): void {
    if (!this.contextoCargado || !this.cargarInventarioResumenPendiente) return;

    const idSeleccionado = this.idTiendaSeleccionada();
    const idTienda =
      idSeleccionado !== null && this.tiendas().some((tienda) => tienda.idTienda === idSeleccionado)
        ? idSeleccionado
        : (this.tiendas()[0]?.idTienda ?? null);
    const forzar = this.forzarInventarioResumenPendiente;

    this.cargarInventarioResumenPendiente = false;
    this.forzarInventarioResumenPendiente = false;

    if (idTienda === null) {
      this.limpiarInventario();
      return;
    }

    this.seleccionarTienda(idTienda, forzar);
  }

  crearPerfilVendedor(): void {
    this.guardandoPerfil.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    this.vendedorApi
      .crearPerfilVendedor()
      .pipe(
        finalize(() => this.guardandoPerfil.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (perfil) => {
          this.perfil.set(perfil);
          this.mensajeExito.set('Perfil vendedor creado correctamente.');
          this.contextoCargado = false;
          this.resumenPedidosCargado = false;
          this.cargarPanel(true);
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  crearTienda(
    solicitud: SolicitudTiendaVendedor,
    alCompletar?: (tienda: TiendaVendedor) => void,
  ): void {
    this.guardandoTienda.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    this.vendedorApi
      .crearTienda(solicitud)
      .pipe(
        finalize(() => this.guardandoTienda.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (tienda) => {
          this.actualizarTiendaEnEstado(tienda);
          this.idTiendaSeleccionada.set(tienda.idTienda);
          this.invalidarInventario();
          this.mensajeExito.set('Tienda creada correctamente.');
          alCompletar?.(tienda);
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  seleccionarTienda(idTienda: number, forzar = false): void {
    this.idTiendaSeleccionada.set(idTienda);
    this.cargarProductosDeTienda(idTienda, forzar);
  }

  cargarProductosDeTienda(idTienda: number, forzar = false): void {
    if (
      !forzar &&
      (this.idTiendaInventarioInterno() === idTienda || this.idTiendaInventarioEnCarga === idTienda)
    ) {
      return;
    }

    const idSolicitud = this.iniciarCargaInventario(idTienda);
    this.mensajeError.set(null);

    const suscripcion = this.vendedorApi
      .obtenerProductosPorTienda(idTienda)
      .pipe(
        finalize(() => this.finalizarCargaInventario(idSolicitud)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (productos) => {
          if (!this.esCargaInventarioActual(idSolicitud, idTienda)) return;
          this.productos.set(productos);
          this.idTiendaInventarioInterno.set(idTienda);
        },
        error: (error: unknown) => {
          if (!this.esCargaInventarioActual(idSolicitud, idTienda)) return;
          this.mensajeError.set(this.obtenerMensajeError(error));
        },
      });

    this.suscripcionInventario = suscripcion.closed ? null : suscripcion;
  }

  cargarCentroTienda(idTienda: number, forzar = false): void {
    const tiendaEnEstado = this.tiendas().some((tienda) => tienda.idTienda === idTienda);
    if (!forzar && tiendaEnEstado && this.idTiendaInventarioInterno() === idTienda) {
      this.idTiendaSeleccionada.set(idTienda);
      return;
    }

    if (!forzar && this.idTiendaCentroEnCarga === idTienda) return;

    this.cargarInventarioResumenPendiente = false;
    this.forzarInventarioResumenPendiente = false;
    const idSolicitud = this.iniciarCargaInventario(idTienda);
    this.idTiendaCentroEnCarga = idTienda;
    this.cargandoTienda.set(idTienda);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    const suscripcion = forkJoin({
      tienda: this.vendedorApi.obtenerTiendaPorId(idTienda),
      productos: this.vendedorApi.obtenerProductosPorTienda(idTienda),
    })
      .pipe(
        finalize(() => this.finalizarCargaInventario(idSolicitud)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ tienda, productos }) => {
          if (!this.esCargaInventarioActual(idSolicitud, idTienda)) return;
          this.actualizarTiendaEnEstado(tienda);
          this.productos.set(productos);
          this.idTiendaInventarioInterno.set(idTienda);
        },
        error: (error: unknown) => {
          if (!this.esCargaInventarioActual(idSolicitud, idTienda)) return;
          this.mensajeError.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos cargar esta tienda.'),
          );
        },
      });

    this.suscripcionInventario = suscripcion.closed ? null : suscripcion;
  }

  cancelarCargaCentroTienda(idTienda: number): void {
    if (this.idTiendaCentroEnCarga !== idTienda) return;
    this.invalidarInventario();
  }

  guardarProducto(
    idTienda: number,
    solicitud: SolicitudProductoVendedor,
    idProducto?: number,
    alCompletar?: (producto: ProductoVendedor) => void,
  ): void {
    this.guardandoProducto.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    const operacion = idProducto
      ? this.vendedorApi.actualizarProducto(idTienda, idProducto, solicitud)
      : this.vendedorApi.crearProducto(idTienda, solicitud);

    // El backend asocia el producto a la tienda del vendedor autenticado; no enviamos idVendedor.
    operacion
      .pipe(
        finalize(() => this.guardandoProducto.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (producto) => {
          if (this.idTiendaInventarioInterno() === idTienda) {
            this.productos.update((productos) => {
              const indice = productos.findIndex(
                (actual) => actual.idProducto === producto.idProducto,
              );
              if (indice < 0) return [...productos, producto];

              return productos.map((actual) =>
                actual.idProducto === producto.idProducto ? producto : actual,
              );
            });
          } else {
            this.invalidarInventario();
          }
          this.mensajeExito.set(
            idProducto ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.',
          );
          alCompletar?.(producto);
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  desactivarProducto(idTienda: number, idProducto: number): void {
    this.desactivandoProducto.set(idProducto);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    this.vendedorApi
      .desactivarProducto(idTienda, idProducto)
      .pipe(
        finalize(() => this.desactivandoProducto.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.cargarProductosDeTienda(idTienda, true);
          this.mensajeExito.set('Producto desactivado correctamente.');
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  cargarPedidosPaginados(consulta: ConsultaPedidosVendedor): void {
    const idSolicitud = ++this.secuenciaCargaPedidos;
    this.suscripcionPedidos?.unsubscribe();
    this.suscripcionPedidos = null;
    this.secuenciaCargaDetallePedido += 1;
    this.suscripcionDetallePedido?.unsubscribe();
    this.suscripcionDetallePedido = null;
    this.cargandoDetallePedido.set(false);
    this.idTiendaPedidosSeleccionada.set(consulta.idTienda ?? null);
    this.idPedidoSeleccionado.set(null);
    this.pedidoDetalle.set(null);
    this.cargandoPedidos.set(true);
    this.mensajeErrorPedidos.set(null);
    this.mensajeErrorDetallePedido.set(null);
    this.limpiarPaginaPedidos();

    const suscripcion = this.vendedorApi
      .obtenerPedidosRecibidos(consulta)
      .pipe(
        finalize(() => {
          if (idSolicitud !== this.secuenciaCargaPedidos) return;
          this.cargandoPedidos.set(false);
          this.suscripcionPedidos = null;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pagina) => {
          if (idSolicitud !== this.secuenciaCargaPedidos) return;
          this.actualizarPaginaPedidos(pagina);
        },
        error: (error: unknown) => {
          if (idSolicitud !== this.secuenciaCargaPedidos) return;
          this.mensajeErrorPedidos.set(this.obtenerMensajeError(error));
        },
      });

    this.suscripcionPedidos = suscripcion.closed ? null : suscripcion;
  }

  seleccionarPedido(idPedido: number, forzar = false): void {
    if (
      !forzar &&
      this.idPedidoSeleccionado() === idPedido &&
      this.pedidoDetalle()?.idPedido === idPedido
    ) {
      return;
    }

    const idSolicitud = ++this.secuenciaCargaDetallePedido;
    this.suscripcionDetallePedido?.unsubscribe();
    this.suscripcionDetallePedido = null;
    this.idPedidoSeleccionado.set(idPedido);
    this.pedidoDetalle.set(null);
    this.cargandoDetallePedido.set(true);
    this.mensajeErrorDetallePedido.set(null);

    const suscripcion = this.vendedorApi
      .obtenerDetallePedidoRecibido(idPedido)
      .pipe(
        finalize(() => {
          if (idSolicitud !== this.secuenciaCargaDetallePedido) return;
          this.cargandoDetallePedido.set(false);
          this.suscripcionDetallePedido = null;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pedido) => {
          if (idSolicitud !== this.secuenciaCargaDetallePedido) return;
          this.pedidoDetalle.set(pedido);
        },
        error: (error: unknown) => {
          if (idSolicitud !== this.secuenciaCargaDetallePedido) return;
          this.mensajeErrorDetallePedido.set(this.obtenerMensajeError(error));
        },
      });

    this.suscripcionDetallePedido = suscripcion.closed ? null : suscripcion;
  }

  cargarTiendasParaPedidos(forzar = false): void {
    if (this.contextoCargado && !forzar) {
      this.tiendasPedidosCargadas = true;
      this.mensajeErrorTiendasPedidos.set(null);
      return;
    }

    if (this.suscripcionTiendasPedidos && !forzar) return;
    if (this.tiendasPedidosCargadas && !forzar) return;

    const idSolicitud = ++this.secuenciaCargaTiendasPedidos;
    this.suscripcionTiendasPedidos?.unsubscribe();
    this.suscripcionTiendasPedidos = null;
    this.cargandoTiendasPedidos.set(true);
    this.mensajeErrorTiendasPedidos.set(null);

    const suscripcion = this.vendedorApi
      .obtenerTiendas()
      .pipe(
        finalize(() => {
          if (idSolicitud !== this.secuenciaCargaTiendasPedidos) return;
          this.cargandoTiendasPedidos.set(false);
          this.suscripcionTiendasPedidos = null;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (tiendas) => {
          if (idSolicitud !== this.secuenciaCargaTiendasPedidos) return;
          this.tiendas.set(tiendas);
          this.tiendasPedidosCargadas = true;
        },
        error: (error: unknown) => {
          if (idSolicitud !== this.secuenciaCargaTiendasPedidos) return;
          this.tiendasPedidosCargadas = false;
          this.mensajeErrorTiendasPedidos.set(this.obtenerMensajeError(error));
        },
      });

    this.suscripcionTiendasPedidos = suscripcion.closed ? null : suscripcion;
  }

  cancelarGestionPedidos(): void {
    this.secuenciaCargaPedidos += 1;
    this.secuenciaCargaDetallePedido += 1;
    this.suscripcionPedidos?.unsubscribe();
    this.suscripcionDetallePedido?.unsubscribe();
    this.suscripcionPedidos = null;
    this.suscripcionDetallePedido = null;
    this.cargandoPedidos.set(false);
    this.cargandoDetallePedido.set(false);
    this.idPedidoSeleccionado.set(null);
    this.pedidoDetalle.set(null);
    this.mensajeErrorPedidos.set(null);
    this.mensajeErrorDetallePedido.set(null);
  }

  limpiarMensajes(): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
  }

  private obtenerMensajeError(error: unknown): string {
    return obtenerMensajeErrorUsuario(error, 'No pudimos cargar la informacion del vendedor.');
  }

  cargarTienda(idTienda: number): void {
    this.cargandoTienda.set(idTienda);
    this.mensajeError.set(null);

    this.vendedorApi
      .obtenerTiendaPorId(idTienda)
      .pipe(
        finalize(() => this.cargandoTienda.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (tienda) => {
          this.actualizarTiendaEnEstado(tienda);
          this.idTiendaSeleccionada.set(tienda.idTienda);
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  actualizarTienda(
    idTienda: number,
    solicitud: SolicitudTiendaVendedor,
    alCompletar?: (tienda: TiendaVendedor) => void,
  ): void {
    this.guardandoTienda.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    this.vendedorApi
      .actualizarTienda(idTienda, solicitud)
      .pipe(
        finalize(() => this.guardandoTienda.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (tienda) => {
          this.actualizarTiendaEnEstado(tienda);
          this.idTiendaSeleccionada.set(tienda.idTienda);
          this.mensajeExito.set('Tienda actualizada correctamente.');
          alCompletar?.(tienda);
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  eliminarTienda(idTienda: number): void {
    this.eliminandoTienda.set(idTienda);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    this.vendedorApi
      .eliminarTienda(idTienda)
      .pipe(
        finalize(() => this.eliminandoTienda.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.tiendas.update((tiendas) =>
            tiendas.filter((tienda) => tienda.idTienda !== idTienda),
          );
          if (this.idTiendaSeleccionada() === idTienda) {
            this.limpiarInventario();
          }
          this.mensajeExito.set('Tienda eliminada correctamente.');
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  private iniciarCargaInventario(idTienda: number): number {
    const idSolicitud = ++this.secuenciaCargaInventario;
    this.suscripcionInventario?.unsubscribe();
    this.suscripcionInventario = null;
    this.idTiendaInventarioEnCarga = idTienda;
    this.idTiendaCentroEnCarga = null;
    this.idTiendaSeleccionada.set(idTienda);
    this.idTiendaInventarioInterno.set(null);
    this.productos.set([]);
    this.cargandoProductos.set(true);
    return idSolicitud;
  }

  private finalizarCargaInventario(idSolicitud: number): void {
    if (idSolicitud !== this.secuenciaCargaInventario) return;

    this.idTiendaInventarioEnCarga = null;
    this.idTiendaCentroEnCarga = null;
    this.cargandoTienda.set(null);
    this.cargandoProductos.set(false);
    this.suscripcionInventario = null;
  }

  private esCargaInventarioActual(idSolicitud: number, idTienda: number): boolean {
    return (
      idSolicitud === this.secuenciaCargaInventario &&
      this.idTiendaInventarioEnCarga === idTienda &&
      this.idTiendaSeleccionada() === idTienda
    );
  }

  private invalidarInventario(): void {
    this.secuenciaCargaInventario += 1;
    this.suscripcionInventario?.unsubscribe();
    this.suscripcionInventario = null;
    this.idTiendaInventarioEnCarga = null;
    this.idTiendaCentroEnCarga = null;
    this.idTiendaInventarioInterno.set(null);
    this.productos.set([]);
    this.cargandoTienda.set(null);
    this.cargandoProductos.set(false);
  }

  private limpiarInventario(): void {
    this.invalidarInventario();
    this.idTiendaSeleccionada.set(null);
  }

  private actualizarTiendaEnEstado(tienda: TiendaVendedor): void {
    this.tiendas.update((tiendas) => {
      const existe = tiendas.some((actual) => actual.idTienda === tienda.idTienda);
      if (!existe) return [...tiendas, tienda];

      return tiendas.map((actual) => (actual.idTienda === tienda.idTienda ? tienda : actual));
    });
  }

  private actualizarPaginaPedidos(pagina: {
    contenido: PedidoRecibidoResumen[];
    paginaActual: number;
    tamanioPagina: number;
    totalElementos: number;
    totalPaginas: number;
    ultimaPagina: boolean;
  }): void {
    this.pedidos.set(pagina.contenido);
    this.paginaPedidosActual.set(pagina.paginaActual);
    this.tamanioPaginaPedidos.set(pagina.tamanioPagina);
    this.totalPedidos.set(pagina.totalElementos);
    this.totalPaginasPedidos.set(pagina.totalPaginas);
    this.ultimaPaginaPedidos.set(pagina.ultimaPagina);
  }

  private limpiarPaginaPedidos(): void {
    this.pedidos.set([]);
    this.paginaPedidosActual.set(0);
    this.totalPedidos.set(0);
    this.totalPaginasPedidos.set(0);
    this.ultimaPaginaPedidos.set(true);
  }
}
