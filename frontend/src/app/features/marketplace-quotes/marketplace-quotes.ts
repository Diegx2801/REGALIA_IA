import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import {
  SellerOrderDetailApiDto,
  SellerOrderPaymentApiDto,
  SellerOrderProductApiDto,
  SellerOrderSummaryApiDto,
} from '../../core/services/data-access/regalia/models/seller-workspace-api.model';
import { RegaliaSellerWorkspaceApiService } from '../../core/services/data-access/regalia/services/regalia-seller-workspace-api.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-marketplace-quotes',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './marketplace-quotes.html',
  styleUrl: './marketplace-quotes.css',
})
export class MarketplaceQuotesComponent {
  private readonly sellerApi = inject(RegaliaSellerWorkspaceApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<SellerOrderSummaryApiDto[]>([]);
  readonly selectedOrder = signal<SellerOrderSummaryApiDto | null>(null);
  readonly selectedOrderDetail = signal<SellerOrderDetailApiDto | null>(null);
  readonly isLoadingOrders = signal(false);
  readonly isLoadingDetail = signal(false);
  readonly errorMessage = signal('');

  readonly metrics = computed(() => {
    const orders = this.orders();
    const paidOrders = orders.filter((order) => this.toNumber(order.saldoPendiente) <= 0);
    const pendingBalanceOrders = orders.filter((order) => this.toNumber(order.saldoPendiente) > 0);
    const paidAmount = orders.reduce((sum, order) => sum + this.toNumber(order.montoPagado), 0);

    return [
      { label: 'Pedidos recibidos', value: String(orders.length), hint: 'Reservas reales asignadas' },
      { label: 'Pagados', value: String(paidOrders.length), hint: 'Sin saldo pendiente' },
      { label: 'Con saldo', value: String(pendingBalanceOrders.length), hint: 'Requieren seguimiento' },
      { label: 'Cobrado', value: `S/ ${this.formatAmount(paidAmount)}`, hint: 'Monto confirmado' },
    ];
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.errorMessage.set('');
    this.isLoadingOrders.set(true);

    this.sellerApi
      .getOrders()
      .pipe(
        finalize(() => this.isLoadingOrders.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          const nextSelection = orders[0] ?? null;
          this.selectedOrder.set(nextSelection);

          if (nextSelection) {
            this.loadOrderDetail(nextSelection.idPedido);
          } else {
            this.selectedOrderDetail.set(null);
          }
        },
        error: () => {
          this.orders.set([]);
          this.selectedOrder.set(null);
          this.selectedOrderDetail.set(null);
          this.errorMessage.set('No se pudieron cargar los pedidos del vendedor.');
        },
      });
  }

  selectOrder(order: SellerOrderSummaryApiDto): void {
    this.selectedOrder.set(order);
    this.loadOrderDetail(order.idPedido);
  }

  isSelectedOrder(order: SellerOrderSummaryApiDto): boolean {
    const selectedOrder = this.selectedOrder();
    return selectedOrder !== null && selectedOrder.idPedido === order.idPedido;
  }

  private loadOrderDetail(orderId: number): void {
    this.isLoadingDetail.set(true);

    this.sellerApi
      .getOrderById(orderId)
      .pipe(
        finalize(() => this.isLoadingDetail.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (order) => this.selectedOrderDetail.set(order),
        error: () => {
          this.selectedOrderDetail.set(null);
          this.errorMessage.set('No se pudo cargar el detalle del pedido seleccionado.');
        },
      });
  }

  paymentStatus(order: { saldoPendiente: number | null | undefined }): 'Pagado' | 'Con saldo' {
    return this.toNumber(order.saldoPendiente) <= 0 ? 'Pagado' : 'Con saldo';
  }

  formatAmount(value: number | null | undefined): string {
    return this.toNumber(value).toFixed(2);
  }

  detailProducts(order: SellerOrderDetailApiDto): SellerOrderProductApiDto[] {
    return order.detalles ?? [];
  }

  detailPayments(order: SellerOrderDetailApiDto): SellerOrderPaymentApiDto[] {
    return order.pagos ?? [];
  }

  trackMetric(_: number, metric: { label: string }): string {
    return metric.label;
  }

  trackOrder(_: number, order: SellerOrderSummaryApiDto): number {
    return order.idPedido;
  }

  trackDetailProduct(_: number, product: SellerOrderProductApiDto): number {
    return product.idProducto;
  }

  trackPayment(_: number, payment: SellerOrderPaymentApiDto): number {
    return payment.idPago;
  }

  private toNumber(value: number | null | undefined): number {
    return Number(value ?? 0);
  }
}
