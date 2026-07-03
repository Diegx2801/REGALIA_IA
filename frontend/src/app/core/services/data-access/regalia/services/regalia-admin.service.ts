import { Injectable, inject } from '@angular/core';
import { AdminMetric } from '../../../../../shared/models/regalia.model';
import { RegaliaOrdersService } from './regalia-orders.service';
import { RegaliaPricingService } from './regalia-pricing.service';
import { RegaliaProviderService } from './regalia-provider.service';

@Injectable({ providedIn: 'root' })
export class RegaliaAdminService {
  private readonly ordersService = inject(RegaliaOrdersService);
  private readonly pricingService = inject(RegaliaPricingService);
  private readonly providerService = inject(RegaliaProviderService);

  getAdminMetrics(): AdminMetric[] {
    const orders = this.ordersService.getOrders();
    const commissions = orders.reduce((sum, order) => sum + order.commission, 0);
    const reserved = orders.reduce((sum, order) => sum + order.reservation, 0);

    return [
      {
        label: 'Pedidos activos',
        value: String(orders.length),
        hint: 'solicitudes con reserva registrada',
      },
      {
        label: 'Reservas captadas',
        value: `S/ ${this.pricingService.roundMoney(reserved)}`,
        hint: 'seña procesada por REGALIA',
      },
      {
        label: 'Comisiones',
        value: `S/ ${this.pricingService.roundMoney(commissions)}`,
        hint: 'ingreso estimado de plataforma',
      },
      {
        label: 'Vendedores',
        value: String(this.providerService.getProviders().length),
        hint: 'perfiles visibles en Trujillo',
      },
    ];
  }
}
