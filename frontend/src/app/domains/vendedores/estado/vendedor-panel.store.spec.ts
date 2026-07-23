import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { RubroApiService } from '../../datos-maestros/acceso-datos/rubro-api.service';
import { TipoProductoApiService } from '../../datos-maestros/acceso-datos/tipo-producto-api.service';
import { VendedorApiService } from '../acceso-datos/vendedor-api.service';
import {
  ProductoVendedor,
  SolicitudProductoVendedor,
  TiendaVendedor,
  VendedorPerfil,
} from '../modelos/vendedor.model';
import { VendedorPanelStore } from './vendedor-panel.store';

describe('VendedorPanelStore', () => {
  let store: VendedorPanelStore;
  let vendedorApi: {
    obtenerPerfilActual: ReturnType<typeof vi.fn>;
    obtenerTiendas: ReturnType<typeof vi.fn>;
    obtenerTiendaPorId: ReturnType<typeof vi.fn>;
    obtenerPedidosRecibidos: ReturnType<typeof vi.fn>;
    obtenerProductosPorTienda: ReturnType<typeof vi.fn>;
    crearPerfilVendedor: ReturnType<typeof vi.fn>;
    crearTienda: ReturnType<typeof vi.fn>;
    crearProducto: ReturnType<typeof vi.fn>;
    actualizarProducto: ReturnType<typeof vi.fn>;
    desactivarProducto: ReturnType<typeof vi.fn>;
    obtenerDetallePedidoRecibido: ReturnType<typeof vi.fn>;
  };
  let rubroApi: { obtenerRubros: ReturnType<typeof vi.fn> };
  let tipoProductoApi: { obtenerTiposProducto: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vendedorApi = {
      obtenerPerfilActual: vi.fn(() => of(crearPerfil())),
      obtenerTiendas: vi.fn(() => of([crearTienda()])),
      obtenerTiendaPorId: vi.fn((idTienda: number) => of(crearTienda(idTienda))),
      obtenerPedidosRecibidos: vi.fn(() => of(crearPaginaPedidos())),
      obtenerProductosPorTienda: vi.fn((idTienda: number) => of([crearProducto(idTienda)])),
      crearPerfilVendedor: vi.fn(() => of(crearPerfil())),
      crearTienda: vi.fn(() => of(crearTienda())),
      crearProducto: vi.fn(() => of(crearProducto(10))),
      actualizarProducto: vi.fn(() => of(crearProducto(10))),
      desactivarProducto: vi.fn(() => of(undefined)),
      obtenerDetallePedidoRecibido: vi.fn((idPedido: number) => of(crearDetallePedido(idPedido))),
    };
    rubroApi = {
      obtenerRubros: vi.fn(() =>
        of([{ idRubro: 1, nombre: 'Regalos', descripcion: 'Regalos', estado: true }]),
      ),
    };
    tipoProductoApi = {
      obtenerTiposProducto: vi.fn(() => of([{ idTipoProducto: 1, nombre: 'Box', estado: true }])),
    };

    TestBed.configureTestingModule({
      providers: [
        VendedorPanelStore,
        { provide: VendedorApiService, useValue: vendedorApi },
        { provide: RubroApiService, useValue: rubroApi },
        { provide: TipoProductoApiService, useValue: tipoProductoApi },
      ],
    });

    store = TestBed.inject(VendedorPanelStore);
  });

  it('carga datos comerciales y calcula metricas de vendedor', () => {
    store.cargarPanel();

    expect(store.perfil()?.correo).toBe('vendedor.demo@regalia.local');
    expect(store.tiendas()).toHaveLength(1);
    expect(store.productosVisibles()).toBe(1);
    expect(store.productosSinStock()).toBe(1);
    expect(store.saldoPendiente()).toBe(70);
    expect(store.inventarioListo()).toBe(true);
  });

  it('carga detalle de pedido recibido desde el servicio vendedor', () => {
    store.seleccionarPedido(1);

    expect(store.pedidoDetalle()?.idPedido).toBe(1);
    expect(store.pedidoDetalle()?.saldoPendiente).toBe(70);
  });

  it('aísla el error del listado sin reemplazar los mensajes de otras pantallas', () => {
    vendedorApi.obtenerPedidosRecibidos.mockReturnValue(
      throwError(() => new Error('No se pudo cargar la bandeja de pedidos.')),
    );

    store.cargarPedidosPaginados({ page: 0, size: 10 });

    expect(store.mensajeErrorPedidos()).toBe('No se pudo cargar la bandeja de pedidos.');
    expect(store.mensajeErrorDetallePedido()).toBeNull();
    expect(store.mensajeError()).toBeNull();
    expect(store.cargandoPedidos()).toBe(false);
    expect(store.pedidos()).toEqual([]);
  });

  it('aísla el error del detalle y conserva disponible el listado', () => {
    store.cargarPedidosPaginados({ page: 0, size: 10 });
    vendedorApi.obtenerDetallePedidoRecibido.mockReturnValue(
      throwError(() => new Error('No se pudo cargar este detalle.')),
    );

    store.seleccionarPedido(1);

    expect(store.pedidos()).toHaveLength(2);
    expect(store.mensajeErrorDetallePedido()).toBe('No se pudo cargar este detalle.');
    expect(store.mensajeErrorPedidos()).toBeNull();
    expect(store.mensajeError()).toBeNull();
    expect(store.pedidoDetalle()).toBeNull();
    expect(store.cargandoDetallePedido()).toBe(false);
  });

  it('carga el selector de tiendas para pedidos sin descargar perfil ni catálogos', () => {
    store.cargarTiendasParaPedidos();

    expect(vendedorApi.obtenerTiendas).toHaveBeenCalledOnce();
    expect(vendedorApi.obtenerPerfilActual).not.toHaveBeenCalled();
    expect(vendedorApi.obtenerPedidosRecibidos).not.toHaveBeenCalled();
    expect(vendedorApi.obtenerProductosPorTienda).not.toHaveBeenCalled();
    expect(rubroApi.obtenerRubros).not.toHaveBeenCalled();
    expect(tipoProductoApi.obtenerTiposProducto).not.toHaveBeenCalled();
    expect(store.tiendas()).toEqual([crearTienda()]);
    expect(store.cargandoTiendasPedidos()).toBe(false);
    expect(store.mensajeErrorTiendasPedidos()).toBeNull();
  });

  it('comparte una carga de contexto mientras la primera solicitud sigue pendiente', () => {
    const perfilPendiente = new Subject<VendedorPerfil>();
    vendedorApi.obtenerPerfilActual.mockReturnValue(perfilPendiente.asObservable());

    store.cargarContexto();
    store.cargarContexto();

    expect(vendedorApi.obtenerPerfilActual).toHaveBeenCalledTimes(1);
    expect(vendedorApi.obtenerTiendas).toHaveBeenCalledTimes(1);
    expect(rubroApi.obtenerRubros).toHaveBeenCalledTimes(1);
    expect(tipoProductoApi.obtenerTiposProducto).toHaveBeenCalledTimes(1);
    expect(store.cargando()).toBe(true);

    perfilPendiente.next(crearPerfil());
    perfilPendiente.complete();

    expect(store.cargando()).toBe(false);
    expect(store.perfil()?.idVendedor).toBe(1);
  });

  it('completa pedidos e inventario al entrar al resumen despues de una carga parcial', () => {
    store.cargarContexto();

    expect(vendedorApi.obtenerPedidosRecibidos).not.toHaveBeenCalled();
    expect(vendedorApi.obtenerProductosPorTienda).not.toHaveBeenCalled();

    store.cargarPanel();

    expect(vendedorApi.obtenerPerfilActual).toHaveBeenCalledTimes(1);
    expect(vendedorApi.obtenerTiendas).toHaveBeenCalledTimes(1);
    expect(vendedorApi.obtenerPedidosRecibidos).toHaveBeenCalledTimes(1);
    expect(vendedorApi.obtenerProductosPorTienda).toHaveBeenCalledTimes(1);
    expect(store.pedidosTodos()).toHaveLength(2);
    expect(store.inventarioListo()).toBe(true);
  });

  it('carga el centro con una sola solicitud por recurso y sin descargar todo el panel', () => {
    store.cargarCentroTienda(20);

    expect(vendedorApi.obtenerTiendaPorId).toHaveBeenCalledOnce();
    expect(vendedorApi.obtenerProductosPorTienda).toHaveBeenCalledOnce();
    expect(vendedorApi.obtenerPerfilActual).not.toHaveBeenCalled();
    expect(vendedorApi.obtenerTiendas).not.toHaveBeenCalled();
    expect(vendedorApi.obtenerPedidosRecibidos).not.toHaveBeenCalled();
    expect(rubroApi.obtenerRubros).not.toHaveBeenCalled();
    expect(tipoProductoApi.obtenerTiposProducto).not.toHaveBeenCalled();
    expect(store.tiendaSeleccionada()?.idTienda).toBe(20);
    expect(store.idTiendaInventario()).toBe(20);
  });

  it('no repite la carga del mismo centro cuando el inventario ya esta sincronizado', () => {
    store.cargarCentroTienda(10);
    store.cargarCentroTienda(10);

    expect(vendedorApi.obtenerTiendaPorId).toHaveBeenCalledTimes(1);
    expect(vendedorApi.obtenerProductosPorTienda).toHaveBeenCalledTimes(1);
  });

  it('crea un producto, lo agrega al inventario sincronizado y ejecuta el callback', () => {
    const productoCreado = crearProducto(10, 2);
    const solicitud = crearSolicitudProducto();
    const alCompletar = vi.fn();
    vendedorApi.crearProducto.mockReturnValue(of(productoCreado));
    store.cargarCentroTienda(10);

    store.guardarProducto(10, solicitud, undefined, alCompletar);

    expect(vendedorApi.crearProducto).toHaveBeenCalledWith(10, solicitud);
    expect(vendedorApi.actualizarProducto).not.toHaveBeenCalled();
    expect(store.productos().map((producto) => producto.idProducto)).toEqual([1, 2]);
    expect(store.mensajeExito()).toBe('Producto creado correctamente.');
    expect(store.guardandoProducto()).toBe(false);
    expect(alCompletar).toHaveBeenCalledOnce();
    expect(alCompletar).toHaveBeenCalledWith(productoCreado);
  });

  it('actualiza el producto sin duplicarlo y ejecuta el callback con el resultado', () => {
    const productoActualizado: ProductoVendedor = {
      ...crearProducto(10),
      nombre: 'Box premium actualizado',
      imagenes: [{ idProductoImagen: 3, urlImagen: '/productos/box-actualizado.webp', orden: 1 }],
      urlImagen: '/productos/box-actualizado.webp',
    };
    const solicitud = crearSolicitudProducto({
      nombre: productoActualizado.nombre,
    });
    const alCompletar = vi.fn();
    vendedorApi.actualizarProducto.mockReturnValue(of(productoActualizado));
    store.cargarCentroTienda(10);

    store.guardarProducto(10, solicitud, productoActualizado.idProducto, alCompletar);

    expect(vendedorApi.actualizarProducto).toHaveBeenCalledWith(
      10,
      productoActualizado.idProducto,
      solicitud,
    );
    expect(vendedorApi.crearProducto).not.toHaveBeenCalled();
    expect(store.productos()).toEqual([productoActualizado]);
    expect(store.mensajeExito()).toBe('Producto actualizado correctamente.');
    expect(store.guardandoProducto()).toBe(false);
    expect(alCompletar).toHaveBeenCalledOnce();
    expect(alCompletar).toHaveBeenCalledWith(productoActualizado);
  });

  it('cancela la carga del centro cuando la pagina deja de estar activa', () => {
    const tiendaPendiente = new Subject<TiendaVendedor>();
    const productosPendientes = new Subject<ProductoVendedor[]>();
    vendedorApi.obtenerTiendaPorId.mockReturnValue(tiendaPendiente.asObservable());
    vendedorApi.obtenerProductosPorTienda.mockReturnValue(productosPendientes.asObservable());

    store.cargarCentroTienda(10);
    store.cancelarCargaCentroTienda(10);

    expect(store.cargandoProductos()).toBe(false);
    expect(store.inventarioListo()).toBe(false);

    tiendaPendiente.next(crearTienda(10));
    tiendaPendiente.complete();
    productosPendientes.next([crearProducto(10)]);
    productosPendientes.complete();

    expect(store.tiendaSeleccionada()).toBeNull();
    expect(store.productos()).toEqual([]);
  });

  it('descarta respuestas anteriores y mantiene la ultima tienda solicitada', () => {
    const tienda10 = new Subject<TiendaVendedor>();
    const tienda20 = new Subject<TiendaVendedor>();
    const productos10 = new Subject<ProductoVendedor[]>();
    const productos20 = new Subject<ProductoVendedor[]>();

    vendedorApi.obtenerTiendaPorId.mockImplementation((idTienda: number) =>
      idTienda === 10 ? tienda10.asObservable() : tienda20.asObservable(),
    );
    vendedorApi.obtenerProductosPorTienda.mockImplementation((idTienda: number) =>
      idTienda === 10 ? productos10.asObservable() : productos20.asObservable(),
    );

    store.cargarCentroTienda(10);
    store.cargarCentroTienda(20);

    expect(store.idTiendaSeleccionada()).toBe(20);
    expect(store.productos()).toEqual([]);
    expect(store.inventarioListo()).toBe(false);
    expect(store.cargandoProductos()).toBe(true);

    tienda20.next(crearTienda(20));
    tienda20.complete();
    productos20.next([crearProducto(20, 2)]);
    productos20.complete();

    expect(store.tiendaSeleccionada()?.idTienda).toBe(20);
    expect(store.productos().map((producto) => producto.idTienda)).toEqual([20]);
    expect(store.inventarioListo()).toBe(true);

    tienda10.next(crearTienda(10));
    tienda10.complete();
    productos10.next([crearProducto(10, 1)]);
    productos10.complete();

    expect(store.tiendaSeleccionada()?.idTienda).toBe(20);
    expect(store.productos().map((producto) => producto.idTienda)).toEqual([20]);
    expect(store.cargandoProductos()).toBe(false);
  });

  it('conserva la ultima pagina de pedidos cuando cambian los filtros rapidamente', () => {
    const paginaAnterior = new Subject<ReturnType<typeof crearPaginaPedidos>>();
    const paginaActual = new Subject<ReturnType<typeof crearPaginaPedidos>>();
    vendedorApi.obtenerPedidosRecibidos.mockImplementation((consulta: { page?: number }) =>
      consulta.page === 0 ? paginaAnterior.asObservable() : paginaActual.asObservable(),
    );

    store.cargarPedidosPaginados({ page: 0, size: 10 });
    store.cargarPedidosPaginados({ page: 1, size: 10 });

    expect(store.cargandoPedidos()).toBe(true);

    paginaActual.next(crearPaginaPedidos(20, 1));
    paginaActual.complete();
    paginaAnterior.next(crearPaginaPedidos(10, 0));
    paginaAnterior.complete();

    expect(store.pedidos().map((pedido) => pedido.idPedido)).toEqual([20, 21]);
    expect(store.paginaPedidosActual()).toBe(1);
    expect(store.cargandoPedidos()).toBe(false);
  });

  it('conserva el ultimo detalle de pedido seleccionado', () => {
    const detalleAnterior = new Subject<ReturnType<typeof crearDetallePedido>>();
    const detalleActual = new Subject<ReturnType<typeof crearDetallePedido>>();
    vendedorApi.obtenerDetallePedidoRecibido.mockImplementation((idPedido: number) =>
      idPedido === 10 ? detalleAnterior.asObservable() : detalleActual.asObservable(),
    );

    store.seleccionarPedido(10);
    store.seleccionarPedido(20);

    detalleActual.next(crearDetallePedido(20));
    detalleActual.complete();
    detalleAnterior.next(crearDetallePedido(10));
    detalleAnterior.complete();

    expect(store.pedidoDetalle()?.idPedido).toBe(20);
    expect(store.cargandoDetallePedido()).toBe(false);
  });

  it('cancela listado y detalle e ignora respuestas tardías al salir de la gestión', () => {
    const paginaPendiente = new Subject<ReturnType<typeof crearPaginaPedidos>>();
    const detallePendiente = new Subject<ReturnType<typeof crearDetallePedido>>();
    vendedorApi.obtenerPedidosRecibidos.mockReturnValue(paginaPendiente.asObservable());
    vendedorApi.obtenerDetallePedidoRecibido.mockReturnValue(detallePendiente.asObservable());

    store.cargarPedidosPaginados({ page: 0, size: 10 });
    store.seleccionarPedido(42);
    expect(store.cargandoPedidos()).toBe(true);
    expect(store.cargandoDetallePedido()).toBe(true);

    store.cancelarGestionPedidos();
    paginaPendiente.next(crearPaginaPedidos(42));
    paginaPendiente.complete();
    detallePendiente.next(crearDetallePedido(42));
    detallePendiente.complete();

    expect(store.cargandoPedidos()).toBe(false);
    expect(store.cargandoDetallePedido()).toBe(false);
    expect(store.idPedidoSeleccionado()).toBeNull();
    expect(store.pedidos()).toEqual([]);
    expect(store.pedidoDetalle()).toBeNull();
    expect(store.mensajeErrorPedidos()).toBeNull();
    expect(store.mensajeErrorDetallePedido()).toBeNull();
  });
});

function crearPerfil(): VendedorPerfil {
  return {
    idVendedor: 1,
    idUsuario: 2,
    nombreCompleto: 'Vendedor Demo',
    correo: 'vendedor.demo@regalia.local',
    verificado: true,
    estado: true,
    fechaCreacion: null,
  };
}

function crearTienda(idTienda = 10): TiendaVendedor {
  return {
    idTienda,
    nombre: `Regalos ${idTienda}`,
    descripcion: 'Tienda demo',
    direccionReferencia: 'Centro',
    estadoRevision: 'APROBADA',
    formalizada: true,
    idDocumentoFiscal: null,
    rubros: [{ idRubro: 1, nombre: 'Regalos' }],
    estado: true,
  };
}

function crearProducto(idTienda: number, idProducto = 1): ProductoVendedor {
  return {
    idProducto,
    idTienda,
    nombreTienda: `Regalos ${idTienda}`,
    idTipoProducto: 1,
    tipoProducto: 'Box',
    nombre: 'Box premium',
    descripcion: 'Box',
    precio: 150,
    stock: 0,
    visibleEnTienda: true,
    estado: true,
    imagenes: [],
    urlImagen: '/assets/brand/producto-fallback.svg',
  };
}

function crearSolicitudProducto(
  cambios: Partial<SolicitudProductoVendedor> = {},
): SolicitudProductoVendedor {
  return {
    idTipoProducto: 1,
    nombre: 'Box premium',
    descripcion: 'Box',
    precio: 150,
    stock: 0,
    visibleEnTienda: true,
    ...cambios,
  };
}

function crearPaginaPedidos(primerIdPedido = 1, paginaActual = 0) {
  return {
    contenido: [
      crearPedidoVendedor(primerIdPedido, 150, 80, 70),
      crearPedidoVendedor(primerIdPedido + 1, 90, 90, 0),
    ],
    paginaActual,
    tamanioPagina: 5,
    totalElementos: 2,
    totalPaginas: 1,
    ultimaPagina: true,
  };
}

function crearDetallePedido(idPedido: number) {
  return {
    ...crearPedidoVendedor(idPedido, 150, 80, 70),
    tipoEntrega: 'Recojo',
    observacion: 'Coordinar',
    estado: true,
    fechaActualizacion: null,
    productos: [],
    pagos: [],
  };
}

function crearPedidoVendedor(
  idPedido: number,
  total: number,
  montoPagado: number,
  saldoPendiente: number,
) {
  return {
    idPedido,
    correoCliente: 'cliente.demo@regalia.local',
    idTienda: 10,
    nombreTienda: 'Regalos Demo',
    fechaEntrega: null,
    estadoPedido: 'RESERVADO',
    total,
    montoPagado,
    saldoPendiente,
    cantidadItems: 1,
    fechaCreacion: null,
  };
}
