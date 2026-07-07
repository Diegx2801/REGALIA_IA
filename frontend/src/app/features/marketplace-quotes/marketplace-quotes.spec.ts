import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import {
  SellerOrderDetailApiDto,
  SellerOrderSummaryApiDto,
} from '../../core/services/data-access/regalia/models/seller-workspace-api.model';
import { RegaliaSellerWorkspaceApiService } from '../../core/services/data-access/regalia/services/regalia-seller-workspace-api.service';
import { MarketplaceQuotesComponent } from './marketplace-quotes';

const orderSummary: SellerOrderSummaryApiDto = {
  idPedido: 1,
  idCliente: 6,
  correoCliente: 'cliente@regalia.com',
  idTienda: 3,
  nombreTienda: 'Regalia Gifts',
  fechaEntrega: '2026-07-05',
  estadoPedido: 'RESERVADO',
  total: 84.9,
  montoPagado: 16.98,
  saldoPendiente: 67.92,
  cantidadItems: 1,
  fechaCreacion: '2026-07-05T23:57:42',
};

const orderDetail: SellerOrderDetailApiDto = {
  ...orderSummary,
  idTipoEntrega: 2,
  tipoEntrega: 'ENTREGA COORDINADA CON VENDEDOR',
  observacion: null,
  subtotal: 84.9,
  estado: true,
  fechaActualizacion: null,
  detalles: [
    {
      idProducto: 8,
      nombreProducto: 'Box Romantico Deluxe',
      cantidad: 1,
      precioUnitario: 84.9,
      subtotal: 84.9,
    },
  ],
  pagos: [
    {
      idPago: 7,
      metodoPagoPasarela: 'ACCOUNT_MONEY',
      codigoTransaccion: '167404148228',
      monto: 16.98,
      estadoPago: 'APROBADO',
      fechaCreacion: '2026-07-05T23:57:42',
    },
  ],
};

class RegaliaSellerWorkspaceApiServiceStub {
  getOrders() {
    return of([orderSummary]);
  }

  getOrderById() {
    return of(orderDetail);
  }
}

describe('MarketplaceQuotesComponent', () => {
  let component: MarketplaceQuotesComponent;
  let fixture: ComponentFixture<MarketplaceQuotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketplaceQuotesComponent],
      providers: [
        provideRouter([]),
        {
          provide: RegaliaSellerWorkspaceApiService,
          useClass: RegaliaSellerWorkspaceApiServiceStub,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MarketplaceQuotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load and select a seller order', () => {
    const order = component.orders()[0];

    component.selectOrder(order);

    expect(component.selectedOrder()?.idPedido).toBe(order.idPedido);
    expect(component.selectedOrderDetail()?.idPedido).toBe(order.idPedido);
  });
});
