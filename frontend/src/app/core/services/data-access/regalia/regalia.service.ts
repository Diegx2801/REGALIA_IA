import { Injectable, inject } from '@angular/core';
import {
  FeaturedProduct,
  FixedPriceProduct,
  OccasionShortcut,
  SellerFilter,
  RegaliaCategory,
  RegaliaOccasion,
  RegaliaSeller,
  ReservationBreakdown,
} from '../../../../shared/models/regalia.model';
import { RegaliaCatalogService } from './services/regalia-catalog.service';
import { RegaliaPricingService } from './services/regalia-pricing.service';
import { RegaliaSellerService } from './services/regalia-seller.service';

@Injectable({ providedIn: 'root' })
export class RegaliaService {
  // Servicio raíz compartido en toda la aplicación. Angular lo resuelve como instancia única.
  private readonly catalogService = inject(RegaliaCatalogService);
  private readonly pricingService = inject(RegaliaPricingService);
  private readonly sellerService = inject(RegaliaSellerService);

  getCategories(): RegaliaCategory[] {
    return this.catalogService.getCategories();
  }

  getOccasions(): RegaliaOccasion[] {
    return this.catalogService.getOccasions();
  }

  getOccasionShortcuts(): OccasionShortcut[] {
    return this.catalogService.getOccasionShortcuts();
  }

  getFeaturedProducts(): FeaturedProduct[] {
    return this.catalogService.getFeaturedProducts();
  }

  getFixedPriceProducts(): FixedPriceProduct[] {
    return this.catalogService.getFixedPriceProducts();
  }

  setRuntimeFixedPriceProducts(products: FixedPriceProduct[]): void {
    this.catalogService.setRuntimeFixedPriceProducts(products);
  }

  upsertRuntimeFixedPriceProduct(product: FixedPriceProduct): void {
    this.catalogService.upsertRuntimeFixedPriceProduct(product);
  }

  getFixedPriceProductById(productId: number): FixedPriceProduct | undefined {
    return this.catalogService.getFixedPriceProductById(productId);
  }

  filterFixedPriceProducts(
    filters: SellerFilter,
    products?: FixedPriceProduct[],
  ): FixedPriceProduct[] {
    return this.catalogService.filterFixedPriceProducts(filters, products);
  }

  getSellers(): RegaliaSeller[] {
    return this.sellerService.getSellers();
  }

  calculateReservationBreakdown(totalAmount: number): ReservationBreakdown {
    return this.pricingService.calculateReservationBreakdown(totalAmount);
  }

  filterSellers(filters: SellerFilter): RegaliaSeller[] {
    return this.sellerService.filterSellers(filters);
  }

  findCompatibleSellers(
    category: RegaliaCategory | 'Todas',
    occasion: RegaliaOccasion,
    budget: number,
  ): RegaliaSeller[] {
    return this.sellerService.findCompatibleSellers(category, occasion, budget);
  }
}
