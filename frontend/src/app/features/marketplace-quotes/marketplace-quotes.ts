import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RegaliaService } from '../../data-access/regalia/regalia.service';
import { RegaliaOrder } from '../../shared/models/regalia.model';

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
  readonly metrics = this.regaliaService.getAdminMetrics();
  readonly selectedOrder = signal<RegaliaOrder>(this.orders()[0]);
  readonly totalCommission = computed(() =>
    this.orders().reduce((sum, order) => sum + order.commission, 0),
  );

  selectOrder(order: RegaliaOrder): void {
    this.selectedOrder.set(order);
  }

  trackMetric(_: number, metric: { label: string }): string {
    return metric.label;
  }

  trackOrder(_: number, order: RegaliaOrder): number {
    return order.id;
  }
}
