import { Injectable } from '@angular/core';
import { REGALIA_SELLERS } from '../data/regalia-mock-data';
import {
  SellerFilter,
  RegaliaCategory,
  RegaliaOccasion,
  RegaliaSeller,
} from '../../../../../shared/models/regalia.model';
import { normalizeRegaliaText } from '../utils/regalia-text.util';

@Injectable({ providedIn: 'root' })
export class RegaliaSellerService {
  getSellers(): RegaliaSeller[] {
    return [...REGALIA_SELLERS];
  }

  /**
   * Filtra perfiles de vendedores para el catalogo usando texto normalizado,
   * evitando que las tildes generen fallos inesperados en la busqueda.
   */
  filterSellers(filters: SellerFilter): RegaliaSeller[] {
    const search = normalizeRegaliaText(filters.search);

    return REGALIA_SELLERS.filter((seller) => {
      const searchableText = normalizeRegaliaText(
        `${seller.businessName} ${seller.description} ${seller.styles.join(' ')} ${seller.category}`,
      );
      const matchesSearch = search.length === 0 || searchableText.includes(search);
      const matchesCategory =
        filters.category === 'Todas' || seller.category === filters.category;
      const matchesOccasion =
        filters.occasion === 'Todas' || seller.occasions.includes(filters.occasion);
      const matchesPrice = seller.priceFrom <= filters.maxPrice;
      const matchesAvailability =
        !filters.availableOnly ||
        normalizeRegaliaText(seller.availability).includes('disponible');

      return (
        matchesSearch && matchesCategory && matchesOccasion && matchesPrice && matchesAvailability
      );
    });
  }

  /**
   * Devuelve vendedores compatibles para el constructor manual de solicitudes
   * sin usar el paso simulado de interpretacion IA.
   */
  findCompatibleSellers(
    category: RegaliaCategory | 'Todas',
    occasion: RegaliaOccasion,
    budget: number,
  ): RegaliaSeller[] {
    return REGALIA_SELLERS.filter((seller) => {
      const matchesCategory = category === 'Todas' || seller.category === category;
      const matchesOccasion = seller.occasions.includes(occasion);
      const matchesBudget = seller.priceFrom <= budget;

      return matchesCategory && matchesOccasion && matchesBudget;
    })
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, 4);
  }
}
