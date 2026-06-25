import { Injectable } from '@angular/core';
import {
  REGALIA_CATEGORIES,
  REGALIA_FEATURED_PRODUCTS,
  REGALIA_FIXED_PRICE_PRODUCTS,
  REGALIA_OCCASIONS,
  REGALIA_OCCASION_SHORTCUTS,
} from '../data/regalia-mock-data';
import {
  FeaturedProduct,
  FixedPriceProduct,
  OccasionShortcut,
  ProviderFilter,
  RegaliaCategory,
  RegaliaOccasion,
} from '../../../../../shared/models/regalia.model';
import { normalizeRegaliaText } from '../utils/regalia-text.util';

@Injectable({ providedIn: 'root' })
export class RegaliaCatalogService {
  private runtimeFixedPriceProducts: FixedPriceProduct[] | null = null;

  setRuntimeFixedPriceProducts(products: FixedPriceProduct[]): void {
    this.runtimeFixedPriceProducts = [...products];
  }

  upsertRuntimeFixedPriceProduct(product: FixedPriceProduct): void {
    const products = this.runtimeFixedPriceProducts ?? REGALIA_FIXED_PRICE_PRODUCTS;
    const productExists = products.some((item) => item.id === product.id);

    this.runtimeFixedPriceProducts = productExists
      ? products.map((item) => (item.id === product.id ? product : item))
      : [...products, product];
  }

  getCategories(): RegaliaCategory[] {
    return [...REGALIA_CATEGORIES];
  }

  getOccasions(): RegaliaOccasion[] {
    return [...REGALIA_OCCASIONS];
  }

  getOccasionShortcuts(): OccasionShortcut[] {
    return [...REGALIA_OCCASION_SHORTCUTS];
  }

  getFeaturedProducts(): FeaturedProduct[] {
    return [...REGALIA_FEATURED_PRODUCTS];
  }

  getFixedPriceProducts(): FixedPriceProduct[] {
    return [...this.getProductSource()];
  }

  getFixedPriceProductById(productId: number): FixedPriceProduct | undefined {
    return this.getProductSource().find((product) => product.id === productId);
  }

  filterFixedPriceProducts(
    filters: ProviderFilter,
    products: FixedPriceProduct[] = this.getProductSource(),
  ): FixedPriceProduct[] {
    const search = normalizeRegaliaText(filters.search);

    return products.filter((product) => {
      const searchableText = normalizeRegaliaText(
        `${product.title} ${product.provider} ${product.shortDescription} ${product.badges.join(' ')} ${product.providerCategory}`,
      );
      const matchesSearch = search.length === 0 || searchableText.includes(search);
      const matchesCategory =
        filters.category === 'Todas' || product.providerCategory === filters.category;
      const matchesOccasion = filters.occasion === 'Todas' || product.occasion === filters.occasion;
      const matchesPrice = product.price <= filters.maxPrice;
      const matchesAvailability =
        !filters.availableOnly || !normalizeRegaliaText(product.stockStatus).includes('agotado');

      return (
        matchesSearch && matchesCategory && matchesOccasion && matchesPrice && matchesAvailability
      );
    });
  }

  private getProductSource(): FixedPriceProduct[] {
    return this.runtimeFixedPriceProducts ?? REGALIA_FIXED_PRICE_PRODUCTS;
  }
}
