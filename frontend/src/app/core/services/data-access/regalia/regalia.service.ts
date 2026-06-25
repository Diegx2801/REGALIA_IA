import { Injectable, inject } from '@angular/core';
import {
  AdminMetric,
  FeaturedProduct,
  FixedPriceProduct,
  MatchRecommendation,
  OccasionShortcut,
  OrderStatus,
  ProviderFilter,
  RegaliaCategory,
  RegaliaOccasion,
  RegaliaOrder,
  RegaliaProvider,
  RegaliaRequest,
  ReservationBreakdown,
} from '../../../../shared/models/regalia.model';
import { RegaliaAdminService } from './services/regalia-admin.service';
import { RegaliaCatalogService } from './services/regalia-catalog.service';
import { RegaliaMatchingService } from './services/regalia-matching.service';
import { RegaliaOrdersService } from './services/regalia-orders.service';
import { RegaliaPricingService } from './services/regalia-pricing.service';
import { RegaliaProviderService } from './services/regalia-provider.service';

@Injectable({ providedIn: 'root' })
export class RegaliaService {
  private readonly adminService = inject(RegaliaAdminService);
  private readonly catalogService = inject(RegaliaCatalogService);
  private readonly matchingService = inject(RegaliaMatchingService);
  private readonly ordersService = inject(RegaliaOrdersService);
  private readonly pricingService = inject(RegaliaPricingService);
  private readonly providerService = inject(RegaliaProviderService);

  getCategories(): RegaliaCategory[] {
    return this.catalogService.getCategories();
  }

  getOccasions(): RegaliaOccasion[] {
    return this.catalogService.getOccasions();
  }

  getOrderStatuses(): OrderStatus[] {
    return this.ordersService.getOrderStatuses();
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
    filters: ProviderFilter,
    products?: FixedPriceProduct[],
  ): FixedPriceProduct[] {
    return this.catalogService.filterFixedPriceProducts(filters, products);
  }

  getProviders(): RegaliaProvider[] {
    return this.providerService.getProviders();
  }

  getOrders(): RegaliaOrder[] {
    return this.ordersService.getOrders();
  }

  calculateReservationBreakdown(totalAmount: number): ReservationBreakdown {
    return this.pricingService.calculateReservationBreakdown(totalAmount);
  }

  filterProviders(filters: ProviderFilter): RegaliaProvider[] {
    return this.providerService.filterProviders(filters);
  }

  findCompatibleProviders(
    category: RegaliaCategory | 'Todas',
    occasion: RegaliaOccasion,
    budget: number,
  ): RegaliaProvider[] {
    return this.providerService.findCompatibleProviders(category, occasion, budget);
  }

  matchRequest(request: RegaliaRequest): MatchRecommendation[] {
    return this.matchingService.matchRequest(request);
  }

  getAdminMetrics(): AdminMetric[] {
    return this.adminService.getAdminMetrics();
  }

  advanceOrderStatus(currentStatus: OrderStatus): OrderStatus {
    return this.ordersService.advanceOrderStatus(currentStatus);
  }
}
