import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart/cart.service';
import { RegaliaService } from '../../core/services/data-access/regalia/regalia.service';
import { RegaliaPublicCatalogApiService } from '../../core/services/data-access/regalia/services/regalia-public-catalog-api.service';
import { MarketplaceStoreCard } from '../../core/services/data-access/regalia/models/public-store-api.model';
import { RegaliaPublicStoreApiService } from '../../core/services/data-access/regalia/services/regalia-public-store-api.service';
import {
  FixedPriceProduct,
  SellerFilter,
  RegaliaCategory,
  RegaliaOccasion,
} from '../../shared/models/regalia.model';

type CatalogSortOption = 'recommended' | 'priceAsc' | 'priceDesc' | 'ratingDesc';
type CatalogLoadState = 'loading' | 'ready' | 'fallback';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class CatalogComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly regaliaService = inject(RegaliaService);
  private readonly publicCatalogApiService = inject(RegaliaPublicCatalogApiService);
  private readonly publicStoreApiService = inject(RegaliaPublicStoreApiService);
  private readonly cartService = inject(CartService);

  readonly categories: Array<RegaliaCategory | 'Todas'> = [
    'Todas',
    ...this.regaliaService.getCategories(),
  ];
  readonly occasions: Array<RegaliaOccasion | 'Todas'> = [
    'Todas',
    ...this.regaliaService.getOccasions(),
  ];
  readonly stores = signal<MarketplaceStoreCard[]>([]);
  readonly products = signal<FixedPriceProduct[]>([]);
  readonly catalogLoadState = signal<CatalogLoadState>('loading');
  readonly addedProductId = signal<number | null>(null);
  readonly cartTotalItems = this.cartService.totalItems;
  readonly sortControl = new FormControl<CatalogSortOption>('recommended', { nonNullable: true });
  readonly sortOptions: Array<{ value: CatalogSortOption; label: string }> = [
    { value: 'recommended', label: 'Recomendados' },
    { value: 'priceAsc', label: 'Menor precio' },
    { value: 'priceDesc', label: 'Mayor precio' },
    { value: 'ratingDesc', label: 'Mejor valorados' },
  ];
  private readonly filtersVersion = signal(0);
  private readonly sortVersion = signal(0);

  readonly filtersForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    category: new FormControl<RegaliaCategory | 'Todas'>('Todas', { nonNullable: true }),
    occasion: new FormControl<RegaliaOccasion | 'Todas'>('Todas', { nonNullable: true }),
    maxPrice: new FormControl(300, { nonNullable: true }),
    availableOnly: new FormControl(true, { nonNullable: true }),
  });

  readonly currentFilters = computed<SellerFilter>(() => {
    this.filtersVersion();
    return this.filtersForm.getRawValue();
  });

  readonly filteredProducts = computed(() =>
    this.regaliaService.filterFixedPriceProducts(this.currentFilters(), this.products()),
  );
  readonly filteredStores = computed(() =>
    this.publicStoreApiService.filterStores(this.stores(), {
      search: this.currentFilters().search,
      category: this.currentFilters().category,
    }),
  );
  readonly sortedProducts = computed(() => {
    this.sortVersion();
    return this.sortProducts(this.filteredProducts(), this.sortControl.value);
  });
  readonly activeFilterLabels = computed(() => {
    const filters = this.currentFilters();
    const labels: string[] = [];

    if (filters.search.trim().length > 0) labels.push(`"${filters.search.trim()}"`);
    if (filters.category !== 'Todas') labels.push(filters.category);
    if (filters.occasion !== 'Todas') labels.push(filters.occasion);
    if (filters.maxPrice < 700) labels.push(`Hasta S/ ${filters.maxPrice}`);
    if (filters.availableOnly) labels.push('Disponibles para reservar');

    return labels;
  });

  ngOnInit(): void {
    this.publicCatalogApiService
      .getPublicProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (products) => {
          this.products.set(products);
          this.regaliaService.setRuntimeFixedPriceProducts(products);
          this.catalogLoadState.set('ready');
        },
        error: () => {
          const fallbackProducts = this.regaliaService.getFixedPriceProducts();
          this.products.set(fallbackProducts);
          this.regaliaService.setRuntimeFixedPriceProducts(fallbackProducts);
          this.catalogLoadState.set('fallback');
        },
      });

    this.publicStoreApiService
      .getPublicStores()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stores) => this.stores.set(stores),
        error: () => this.stores.set([]),
      });
  }

  applyCategory(category: RegaliaCategory | 'Todas'): void {
    this.filtersForm.controls.category.setValue(category);
    this.refreshFilters();
  }

  addProductToCart(product: FixedPriceProduct): void {
    this.cartService.addProduct(product);
    this.addedProductId.set(product.id);
  }

  resetFilters(): void {
    this.filtersForm.setValue({
      search: '',
      category: 'Todas',
      occasion: 'Todas',
      maxPrice: 300,
      availableOnly: true,
    });
    this.addedProductId.set(null);
    this.refreshFilters();
  }

  onFiltersChanged(): void {
    this.refreshFilters();
  }

  onSortChanged(): void {
    this.sortVersion.update((value) => value + 1);
  }

  trackStore(_: number, store: MarketplaceStoreCard): number {
    return store.id;
  }

  trackProduct(_: number, product: FixedPriceProduct): number {
    return product.id;
  }

  trackText(_: number, value: string): string {
    return value;
  }

  private refreshFilters(): void {
    this.filtersVersion.update((value) => value + 1);
  }

  private sortProducts(
    products: FixedPriceProduct[],
    sortBy: CatalogSortOption,
  ): FixedPriceProduct[] {
    const sortedProducts = [...products];

    if (sortBy === 'priceAsc') {
      return sortedProducts.sort((a, b) => a.price - b.price);
    }

    if (sortBy === 'priceDesc') {
      return sortedProducts.sort((a, b) => b.price - a.price);
    }

    if (sortBy === 'ratingDesc') {
      return sortedProducts.sort((a, b) => b.rating - a.rating);
    }

    return sortedProducts;
  }
}
