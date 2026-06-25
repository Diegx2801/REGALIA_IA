import { Injectable } from '@angular/core';
import { REGALIA_PROVIDERS } from '../data/regalia-mock-data';
import {
  ProviderFilter,
  RegaliaCategory,
  RegaliaOccasion,
  RegaliaProvider,
} from '../../../../../shared/models/regalia.model';
import { normalizeRegaliaText } from '../utils/regalia-text.util';

@Injectable({ providedIn: 'root' })
export class RegaliaProviderService {
  getProviders(): RegaliaProvider[] {
    return [...REGALIA_PROVIDERS];
  }

  /**
   * Filtra perfiles de proveedores para el catalogo usando texto normalizado,
   * evitando que las tildes generen fallos inesperados en la busqueda.
   */
  filterProviders(filters: ProviderFilter): RegaliaProvider[] {
    const search = normalizeRegaliaText(filters.search);

    return REGALIA_PROVIDERS.filter((provider) => {
      const searchableText = normalizeRegaliaText(
        `${provider.businessName} ${provider.description} ${provider.styles.join(' ')} ${provider.category}`,
      );
      const matchesSearch = search.length === 0 || searchableText.includes(search);
      const matchesCategory =
        filters.category === 'Todas' || provider.category === filters.category;
      const matchesOccasion =
        filters.occasion === 'Todas' || provider.occasions.includes(filters.occasion);
      const matchesPrice = provider.priceFrom <= filters.maxPrice;
      const matchesAvailability =
        !filters.availableOnly ||
        normalizeRegaliaText(provider.availability).includes('disponible');

      return (
        matchesSearch && matchesCategory && matchesOccasion && matchesPrice && matchesAvailability
      );
    });
  }

  /**
   * Devuelve proveedores compatibles para el constructor manual de solicitudes
   * sin usar el paso simulado de interpretacion IA.
   */
  findCompatibleProviders(
    category: RegaliaCategory | 'Todas',
    occasion: RegaliaOccasion,
    budget: number,
  ): RegaliaProvider[] {
    return REGALIA_PROVIDERS.filter((provider) => {
      const matchesCategory = category === 'Todas' || provider.category === category;
      const matchesOccasion = provider.occasions.includes(occasion);
      const matchesBudget = provider.priceFrom <= budget;

      return matchesCategory && matchesOccasion && matchesBudget;
    })
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, 4);
  }
}
