import { Injectable, inject } from '@angular/core';
import { REGALIA_ORDER_DRAFTS, REGALIA_ORDER_STATUSES } from '../data/regalia-mock-data';
import { OrderStatus, RegaliaOrder } from '../../../../../shared/models/regalia.model';
import { RegaliaPricingService } from './regalia-pricing.service';

@Injectable({ providedIn: 'root' })
export class RegaliaOrdersService {
  private readonly pricingService = inject(RegaliaPricingService);

  getOrderStatuses(): OrderStatus[] {
    return [...REGALIA_ORDER_STATUSES];
  }

  getOrders(): RegaliaOrder[] {
    return REGALIA_ORDER_DRAFTS.map((order) => {
      const breakdown = this.pricingService.calculateReservationBreakdown(order.total);

      return {
        ...order,
        reservation: breakdown.reservation,
        commission: breakdown.platformCommission,
      };
    });
  }

  /**
   * Avanza un pedido dentro del flujo operativo de estados del MVP.
   */
  advanceOrderStatus(currentStatus: OrderStatus): OrderStatus {
    const currentIndex = REGALIA_ORDER_STATUSES.indexOf(currentStatus);
    const nextIndex = Math.min(currentIndex + 1, REGALIA_ORDER_STATUSES.length - 1);

    return REGALIA_ORDER_STATUSES[nextIndex] ?? currentStatus;
  }
}
