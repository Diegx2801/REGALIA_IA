import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PedidoClienteApiService } from '../acceso-datos/pedido-cliente-api.service';
import { UsuarioApiService } from '../acceso-datos/usuario-api.service';
import { ClientePanelStore } from './cliente-panel.store';

describe('ClientePanelStore', () => {
  let store: ClientePanelStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ClientePanelStore,
        {
          provide: UsuarioApiService,
          useValue: {
            obtenerPerfilActual: () =>
              of({
                idUsuario: 1,
                nombres: 'Cliente',
                apellidos: 'Demo',
                nombreCompleto: 'Cliente Demo',
                correo: 'cliente.demo@regalia.local',
                telefono: '999888777',
                correoVerificado: false,
                estado: true,
                fechaCreacion: null,
                fechaActualizacion: null,
              }),
            actualizarPerfil: () =>
              of({
                idUsuario: 1,
                nombres: 'Cliente',
                apellidos: 'Actualizado',
                nombreCompleto: 'Cliente Actualizado',
                correo: 'cliente.demo@regalia.local',
                telefono: '999888777',
                correoVerificado: true,
                estado: true,
                fechaCreacion: null,
                fechaActualizacion: null,
              }),
          },
        },
        {
          provide: PedidoClienteApiService,
          useValue: {
            obtenerMisPedidos: () =>
              of([
                crearPedidoCliente(1, 120, 60, 60, 'PENDIENTE'),
                crearPedidoCliente(2, 80, 80, 0, 'ENTREGADO'),
              ]),
            obtenerMiPedidoPorId: (idPedido: number) =>
              of(crearPedidoCliente(idPedido, 120, 60, 60, 'PENDIENTE')),
            registrarPagoRestante: (idPedido: number) =>
              of(crearPedidoCliente(idPedido, 120, 120, 0, 'PENDIENTE')),
          },
        },
      ],
    });

    store = TestBed.inject(ClientePanelStore);
  });

  it('carga perfil y calcula metricas desde pedidos reales del servicio', () => {
    store.cargarPanel();

    expect(store.perfil()?.correo).toBe('cliente.demo@regalia.local');
    expect(store.pedidosActivos()).toBe(1);
    expect(store.saldoPendiente()).toBe(60);
    expect(store.totalPagado()).toBe(140);
  });

  it('actualiza el pedido local luego de registrar pago restante', () => {
    store.cargarPanel();
    store.registrarPagoRestante(1, 'YAPE', 'TX-001');

    expect(store.pedidos().find((pedido) => pedido.idPedido === 1)?.saldoPendiente).toBe(0);
    expect(store.mensajeExito()).toBe('Pago registrado correctamente.');
  });
});

function crearPedidoCliente(
  idPedido: number,
  total: number,
  montoPagado: number,
  saldoPendiente: number,
  estadoPedido: string,
) {
  return {
    idPedido,
    idTienda: 1,
    nombreTienda: 'Tienda REGALIA',
    tipoEntrega: 'Recojo',
    fechaEntrega: null,
    observacion: 'Sin observacion',
    estadoPedido,
    subtotal: total,
    total,
    montoPagado,
    saldoPendiente,
    estado: true,
    fechaCreacion: null,
    fechaActualizacion: null,
    productos: [],
  };
}
