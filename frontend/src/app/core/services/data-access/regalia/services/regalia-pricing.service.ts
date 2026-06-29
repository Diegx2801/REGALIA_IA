import { Injectable } from '@angular/core';
import { ReservationBreakdown } from '../../../../../shared/models/regalia.model';

@Injectable({ providedIn: 'root' })
export class RegaliaPricingService {
  /**
   * Calcula el desglose de reserva para una solicitud confirmada.
   *
   * Regla actual del MVP:
   * - El cliente paga el 10% del total estimado del pedido como reserva.
   * - REGALIA retiene el 30% de esa reserva como comision de plataforma.
   * - El monto restante se asigna al vendedor como adelanto.
   */
  calculateReservationBreakdown(totalAmount: number): ReservationBreakdown {
    const estimatedOrder = this.roundMoney(Math.max(totalAmount, 0));
    const reservation = this.roundMoney(estimatedOrder * 0.1);
    const platformCommission = this.roundMoney(reservation * 0.3);
    const providerCredit = this.roundMoney(reservation - platformCommission);

    return { estimatedOrder, reservation, platformCommission, providerCredit };
  }

  roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
