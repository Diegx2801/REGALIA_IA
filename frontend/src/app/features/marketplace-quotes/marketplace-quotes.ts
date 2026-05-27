import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RegaliaService } from '../../core/services/data-access/regalia/regalia.service';
import { AdminMetric, OrderStatus, RegaliaOrder } from '../../shared/models/regalia.model';

@Component({
  selector: 'app-marketplace-quotes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './marketplace-quotes.html',
  styleUrl: './marketplace-quotes.css',
})
export class MarketplaceQuotesComponent {
  private readonly regaliaService = inject(RegaliaService);

  readonly orders = signal(this.regaliaService.getOrders());
  readonly metrics: AdminMetric[] = this.regaliaService.getAdminMetrics();
  readonly statuses: OrderStatus[] = this.regaliaService.getOrderStatuses();
  readonly selectedOrder = signal<RegaliaOrder>(this.orders()[0]);
  readonly selectedBreakdown = computed(() =>
    this.regaliaService.calculateReservationBreakdown(this.selectedOrder().total),
  );
  readonly totalCommission = computed(() =>
    this.orders().reduce((sum, order) => sum + this.regaliaService.calculateReservationBreakdown(order.total).platformCommission, 0),
  );

  selectOrder(order: RegaliaOrder): void {
    this.selectedOrder.set(order);
  }

  /**
   * Mueve el pedido seleccionado al siguiente estado operativo visible,
   * manteniendo sincronizados la lista y el panel de detalle.
   */
  advanceSelectedOrderStatus(): void {
    const currentOrder = this.selectedOrder();
    const updatedOrder = {
      ...currentOrder,
      status: this.regaliaService.advanceOrderStatus(currentOrder.status),
    };

    this.orders.update((orders) => orders.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)));
    this.selectedOrder.set(updatedOrder);
  }

  trackMetric(_: number, metric: AdminMetric): string {
    return metric.label;
  }

  trackOrder(_: number, order: RegaliaOrder): number {
    return order.id;
  }

  trackStatus(_: number, status: OrderStatus): string {
    return status;
  }
}
