import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RubroApiService } from '../../datos-maestros/acceso-datos/rubro-api.service';
import { TipoProductoApiService } from '../../datos-maestros/acceso-datos/tipo-producto-api.service';
import { VendedorApiService } from '../acceso-datos/vendedor-api.service';
import { VendedorPanelStore } from './vendedor-panel.store';

describe('VendedorPanelStore', () => {
  let store: VendedorPanelStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VendedorPanelStore,
        {
          provide: VendedorApiService,
          useValue: {
            obtenerPerfilActual: () =>
              of({
                idVendedor: 1,
                idUsuario: 2,
                nombreCompleto: 'Vendedor Demo',
                correo: 'vendedor.demo@regalia.local',
                verificado: true,
                estado: true,
                fechaCreacion: null,
              }),
            obtenerTiendas: () =>
              of([
                {
                  idTienda: 10,
                  nombre: 'Regalos Demo',
                  descripcion: 'Tienda demo',
                  direccionReferencia: 'Centro',
                  estadoRevision: 'APROBADA',
                  formalizada: true,
                  rubros: [{ idRubro: 1, nombre: 'Regalos' }],
                  estado: true,
                },
              ]),
            obtenerPedidosRecibidos: () =>
              of([
                crearPedidoVendedor(1, 150, 80, 70),
                crearPedidoVendedor(2, 90, 90, 0),
              ]),
            obtenerProductosPorTienda: () =>
              of([
                {
                  idProducto: 1,
                  idTienda: 10,
                  nombreTienda: 'Regalos Demo',
                  tipoProducto: 'Box',
                  nombre: 'Box premium',
                  descripcion: 'Box',
                  precio: 150,
                  stock: 0,
                  visibleEnTienda: true,
                  estado: true,
                  urlImagen: '/assets/brand/producto-fallback.svg',
                },
              ]),
            crearPerfilVendedor: () => of({}),
            crearTienda: () => of({}),
            crearProducto: () => of({}),
            actualizarProducto: () => of({}),
            desactivarProducto: () => of(undefined),
            obtenerPedidosPorTienda: () => of([crearPedidoVendedor(1, 150, 80, 70)]),
            obtenerDetallePedidoRecibido: (idPedido: number) =>
              of({ ...crearPedidoVendedor(idPedido, 150, 80, 70), tipoEntrega: 'Recojo', observacion: 'Coordinar', estado: true, fechaActualizacion: null, productos: [], pagos: [] }),
          },
        },
        {
          provide: RubroApiService,
          useValue: { obtenerRubros: () => of([{ idRubro: 1, nombre: 'Regalos', descripcion: 'Regalos', estado: true }]) },
        },
        {
          provide: TipoProductoApiService,
          useValue: { obtenerTiposProducto: () => of([{ idTipoProducto: 1, nombre: 'Box', estado: true }]) },
        },
      ],
    });

    store = TestBed.inject(VendedorPanelStore);
  });

  it('carga datos comerciales y calcula metricas de vendedor', () => {
    store.cargarPanel();

    expect(store.perfil()?.correo).toBe('vendedor.demo@regalia.local');
    expect(store.tiendas().length).toBe(1);
    expect(store.productosVisibles()).toBe(1);
    expect(store.productosSinStock()).toBe(1);
    expect(store.saldoPendiente()).toBe(70);
  });

  it('carga detalle de pedido recibido desde el servicio vendedor', () => {
    store.seleccionarPedido(1);

    expect(store.pedidoDetalle()?.idPedido).toBe(1);
    expect(store.pedidoDetalle()?.saldoPendiente).toBe(70);
  });
});

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
    estadoPedido: 'PENDIENTE',
    total,
    montoPagado,
    saldoPendiente,
    cantidadItems: 1,
    fechaCreacion: null,
  };
}
