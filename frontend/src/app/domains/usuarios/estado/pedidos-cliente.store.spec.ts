import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PedidoClienteApiService } from '../acceso-datos/pedido-cliente-api.service';
import { PedidosClienteStore } from './pedidos-cliente.store';

describe('PedidosClienteStore', () => {
  let store: PedidosClienteStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PedidosClienteStore,
        {
          provide: PedidoClienteApiService,
          useValue: {
            obtenerMisPedidos: () =>
              of({
                contenido: [
                  {
                    idPedido: 10,
                    nombreTienda: 'Regalia Gifts',
                    tipoEntrega: 'Recojo en tienda',
                    fechaEntrega: null,
                    estadoPedido: 'RESERVADO',
                    total: 84.9,
                    montoPagado: 84.9,
                    saldoPendiente: 0,
                    fechaCreacion: null,
                  },
                ],
                paginaActual: 0,
                tamanioPagina: 10,
                totalElementos: 1,
                totalPaginas: 1,
                ultimaPagina: true,
              }),
          },
        },
      ],
    });

    store = TestBed.inject(PedidosClienteStore);
  });

  it('conserva los metadatos paginados recibidos del servicio', () => {
    store.cargarListado({ page: 0, size: 10 });

    expect(store.pedidos()).toHaveLength(1);
    expect(store.totalElementos()).toBe(1);
    expect(store.ultimaPagina()).toBe(true);
  });
});
