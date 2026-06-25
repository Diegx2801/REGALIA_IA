import { Injectable, inject } from '@angular/core';
import {
  MatchRecommendation,
  RegaliaCategory,
  RegaliaProvider,
  RegaliaRequest,
} from '../../../../../shared/models/regalia.model';
import { normalizeRegaliaText } from '../utils/regalia-text.util';
import { RegaliaPricingService } from './regalia-pricing.service';
import { RegaliaProviderService } from './regalia-provider.service';

@Injectable({ providedIn: 'root' })
export class RegaliaMatchingService {
  private readonly pricingService = inject(RegaliaPricingService);
  private readonly providerService = inject(RegaliaProviderService);

  /**
   * Construye la lista simulada de recomendaciones IA usada por el flujo MVP.
   * Mas adelante puede reemplazarse por un servicio real de emparejamiento u ordenamiento.
   */
  matchRequest(request: RegaliaRequest): MatchRecommendation[] {
    const interpretedCategory = this.inferCategory(request);

    return this.providerService
      .getProviders()
      .map((provider) => {
        const score = this.scoreProvider(provider, request, interpretedCategory);
        const estimatedOrder = Math.min(
          Math.max(request.budget, provider.priceFrom),
          provider.priceTo,
        );

        return {
          provider,
          score,
          reason: this.reasonFor(provider, request, interpretedCategory),
          interpretedNeed: {
            category: interpretedCategory,
            occasion: request.occasion,
            style: request.style || 'personalizado',
            urgency: request.urgent ? 'alta' : 'normal',
            budgetFit:
              estimatedOrder <= request.budget ? 'dentro del presupuesto' : 'requiere ajuste',
          },
          reservation: this.pricingService.calculateReservationBreakdown(estimatedOrder),
        };
      })
      .filter((recommendation) => recommendation.score >= 60)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }

  private inferCategory(request: RegaliaRequest): RegaliaCategory {
    const need = normalizeRegaliaText(request.need);

    if (need.includes('flor') || need.includes('ramo')) return 'Arreglos florales';
    if (need.includes('torta') || need.includes('cupcake') || need.includes('dulce'))
      return 'Repostería personalizada';
    if (need.includes('caja') || need.includes('desayuno')) return 'Cajas sorpresa';
    if (need.includes('taza') || need.includes('polo') || need.includes('sublim'))
      return 'Sublimados';
    if (need.includes('madera') || need.includes('grabado')) return 'Carpintería personalizada';
    if (need.includes('decor') || need.includes('evento')) return 'Decoración de eventos';
    if (need.includes('foto') || need.includes('diseno')) return 'Servicios creativos';

    return request.occasion === 'Evento corporativo' ? 'Servicios creativos' : 'Cajas sorpresa';
  }

  private scoreProvider(
    provider: RegaliaProvider,
    request: RegaliaRequest,
    category: RegaliaCategory,
  ): number {
    const normalizedStyle = normalizeRegaliaText(request.style);
    const categoryScore = provider.category === category ? 30 : 8;
    const occasionScore = provider.occasions.includes(request.occasion) ? 20 : 4;
    const budgetScore = request.budget >= provider.priceFrom ? 18 : 6;
    const styleScore = provider.styles.some((style) =>
      normalizedStyle.includes(normalizeRegaliaText(style)),
    )
      ? 12
      : 5;
    const urgencyScore =
      request.urgent && normalizeRegaliaText(provider.deliveryTime).includes('mismo') ? 10 : 6;
    const reputationScore = Math.round(provider.reputation / 10);

    return Math.min(
      99,
      categoryScore + occasionScore + budgetScore + styleScore + urgencyScore + reputationScore,
    );
  }

  private reasonFor(
    provider: RegaliaProvider,
    request: RegaliaRequest,
    category: RegaliaCategory,
  ): string {
    if (provider.category === category && provider.occasions.includes(request.occasion)) {
      return `Coincide con la categoría detectada, trabaja ${request.occasion.toLowerCase()} y encaja con el presupuesto referencial.`;
    }

    return 'Puede resolver la solicitud por estilo, reputación y disponibilidad, aunque requiere validar detalles finales.';
  }
}
