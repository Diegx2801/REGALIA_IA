import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin, of, switchMap } from 'rxjs';
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

@Injectable({ providedIn: 'root' })
export class VendedorPanelStore {
  private readonly vendedorApi = inject(VendedorApiService);
  private readonly rubroApi = inject(RubroApiService);
  private readonly tipoProductoApi = inject(TipoProductoApiService);
  private readonly destroyRef = inject(DestroyRef);
  private panelCargado = false;

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
  readonly rubros = signal<Rubro[]>([]);
  readonly tiposProducto = signal<TipoProducto[]>([]);
  readonly idTiendaSeleccionada = signal<number | null>(null);
  readonly idTiendaPedidosSeleccionada = signal<number | null>(null);
  readonly cargando = signal(false);
  readonly cargandoProductos = signal(false);
  readonly cargandoPedidos = signal(false);
  readonly cargandoDetallePedido = signal(false);
  readonly guardandoPerfil = signal(false);
  readonly guardandoTienda = signal(false);
  readonly guardandoProducto = signal(false);
  readonly desactivandoProducto = signal<number | null>(null);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

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
  readonly pedidosRecientes = computed(() => this.pedidosTodos().slice(0, 5));
  readonly tiendasPendientesRevision = computed(
    () => this.tiendas().filter((tienda) => tienda.estadoRevision !== 'APROBADA').length,
  );
  readonly debeCrearPerfil = computed(() =>
    (this.mensajeError() ?? '').toLowerCase().includes('perfil vendedor'),
  );

  cargarPanel(forzar = false, incluirPedidos = true): void {
    if (this.panelCargado && !forzar) return;

    this.cargando.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    forkJoin({
      perfil: this.vendedorApi.obtenerPerfilActual(),
      tiendas: this.vendedorApi.obtenerTiendas(),
      pedidos: incluirPedidos
        ? this.vendedorApi.obtenerPedidosRecibidos({ page: 0, size: 5 })
        : of({
            contenido: [] as PedidoRecibidoResumen[],
            paginaActual: 0,
            tamanioPagina: 10,
            totalElementos: 0,
            totalPaginas: 0,
            ultimaPagina: true,
          }),
      rubros: this.rubroApi.obtenerRubros(),
      tiposProducto: this.tipoProductoApi.obtenerTiposProducto(),
    })
      .pipe(
        switchMap(({ perfil, tiendas, pedidos, rubros, tiposProducto }) => {
          this.perfil.set(perfil);
          this.tiendas.set(tiendas);
          if (incluirPedidos) {
            this.actualizarPaginaPedidos(pedidos);
            this.pedidosTodos.set(pedidos.contenido);
          }
          this.rubros.set(rubros);
          this.tiposProducto.set(tiposProducto);

          const primeraTienda = tiendas[0]?.idTienda ?? null;
          this.idTiendaSeleccionada.set(primeraTienda);

          // Los productos dependen de la tienda activa; no se consultan si el vendedor aun no tiene tiendas.
          return primeraTienda
            ? this.vendedorApi.obtenerProductosPorTienda(primeraTienda)
            : of<ProductoVendedor[]>([]);
        }),
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (productos) => {
          this.productos.set(productos);
          this.panelCargado = true;
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
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
          this.panelCargado = false;
          this.cargarPanel(true);
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  crearTienda(solicitud: SolicitudTiendaVendedor): void {
    this.guardandoTienda.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    this.vendedorApi
      .crearTienda(solicitud)
      .pipe(
        switchMap(() => this.vendedorApi.obtenerTiendas()),
        finalize(() => this.guardandoTienda.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (tiendas) => {
          this.tiendas.set(tiendas);
          const primeraTienda = tiendas[0]?.idTienda ?? null;
          this.idTiendaSeleccionada.set(primeraTienda);
          if (primeraTienda) this.cargarProductosDeTienda(primeraTienda);
          this.mensajeExito.set('Tienda creada correctamente.');
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  seleccionarTienda(idTienda: number): void {
    this.idTiendaSeleccionada.set(idTienda);
    this.cargarProductosDeTienda(idTienda);
  }

  cargarProductosDeTienda(idTienda: number): void {
    this.cargandoProductos.set(true);
    this.mensajeError.set(null);

    this.vendedorApi
      .obtenerProductosPorTienda(idTienda)
      .pipe(
        finalize(() => this.cargandoProductos.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (productos) => this.productos.set(productos),
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  guardarProducto(idTienda: number, solicitud: SolicitudProductoVendedor, idProducto?: number): void {
    this.guardandoProducto.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    const operacion = idProducto
      ? this.vendedorApi.actualizarProducto(idTienda, idProducto, solicitud)
      : this.vendedorApi.crearProducto(idTienda, solicitud);

    // El backend asocia el producto a la tienda del vendedor autenticado; no enviamos idVendedor.
    operacion
      .pipe(
        switchMap(() => this.vendedorApi.obtenerProductosPorTienda(idTienda)),
        finalize(() => this.guardandoProducto.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (productos) => {
          this.productos.set(productos);
          this.mensajeExito.set(idProducto ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
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
        switchMap(() => this.vendedorApi.obtenerProductosPorTienda(idTienda)),
        finalize(() => this.desactivandoProducto.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (productos) => {
          this.productos.set(productos);
          this.mensajeExito.set('Producto desactivado correctamente.');
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  cargarPedidosPaginados(consulta: ConsultaPedidosVendedor): void {
    this.idTiendaPedidosSeleccionada.set(consulta.idTienda ?? null);
    this.pedidoDetalle.set(null);
    this.cargandoPedidos.set(true);
    this.mensajeError.set(null);

    this.vendedorApi
      .obtenerPedidosRecibidos(consulta)
      .pipe(
        finalize(() => this.cargandoPedidos.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pagina) => this.actualizarPaginaPedidos(pagina),
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  seleccionarPedido(idPedido: number): void {
    this.pedidoDetalle.set(null);
    this.cargandoDetallePedido.set(true);
    this.mensajeError.set(null);

    this.vendedorApi
      .obtenerDetallePedidoRecibido(idPedido)
      .pipe(
        finalize(() => this.cargandoDetallePedido.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pedido) => this.pedidoDetalle.set(pedido),
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  limpiarMensajes(): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
  }

  private obtenerMensajeError(error: unknown): string {
    return obtenerMensajeErrorUsuario(error, 'No pudimos cargar la informacion del vendedor.');
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
}
