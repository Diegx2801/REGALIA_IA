import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CatalogService } from '../../data-access/catalog/catalog.service';
import { CatalogFilters, CatalogProduct } from '../../shared/models/catalog-product.model';
import { ComponentCategory } from '../../shared/models/pc-build.model';

type CatalogSort = 'featured' | 'priceAsc' | 'priceDesc' | 'rating';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class CatalogComponent {
  private readonly catalogService = inject(CatalogService);

  readonly categories = this.catalogService.getCategories();
  readonly brands = ['All', ...this.catalogService.getBrands()];
  readonly products = signal(this.catalogService.getProducts());
  readonly selectedProduct = signal<CatalogProduct | null>(this.products()[0] ?? null);
  readonly cartCount = signal(0);
  private readonly filtersVersion = signal(0);

  readonly filtersForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    category: new FormControl<ComponentCategory | 'All'>('All', { nonNullable: true }),
    brand: new FormControl('All', { nonNullable: true }),
    stockOnly: new FormControl(true, { nonNullable: true }),
    maxPrice: new FormControl(3000, { nonNullable: true }),
    sort: new FormControl<CatalogSort>('featured', { nonNullable: true }),
  });

  readonly filteredProducts = computed(() => {
    this.filtersVersion();
    const filters: CatalogFilters = this.filtersForm.getRawValue();
    const products = this.catalogService.filterProducts(filters);

    return this.sortProducts(products, this.filtersForm.controls.sort.value);
  });

  readonly featuredDeal = computed(() => {
    return [...this.products()].sort((first, second) => this.discountValue(second) - this.discountValue(first))[0] ?? null;
  });

  readonly totalStock = computed(() => {
    return this.filteredProducts().reduce((total, product) => total + product.stock, 0);
  });

  applyQuickCategory(category: ComponentCategory | 'All'): void {
    this.filtersForm.controls.category.setValue(category);
    this.refreshFilters();
    this.ensureSelectedProductIsVisible();
  }

  selectProduct(product: CatalogProduct): void {
    this.selectedProduct.set(product);
  }

  resetFilters(): void {
    this.filtersForm.setValue({
      search: '',
      category: 'All',
      brand: 'All',
      stockOnly: true,
      maxPrice: 3000,
      sort: 'featured',
    });
    this.refreshFilters();
    this.selectedProduct.set(this.products()[0] ?? null);
  }

  onFiltersChanged(): void {
    this.refreshFilters();
    this.ensureSelectedProductIsVisible();
  }

  attributeEntries(product: CatalogProduct): Array<[string, string]> {
    return Object.entries(product.attributes);
  }

  trackProduct(_: number, product: CatalogProduct): number {
    return product.id;
  }

  trackValue(_: number, value: string): string {
    return value;
  }

  trackAttribute(_: number, attribute: [string, string]): string {
    return attribute[0];
  }

  discountValue(product: CatalogProduct): number {
    if (!product.previousPrice) {
      return 0;
    }

    return Math.round(((product.previousPrice - product.price) / product.previousPrice) * 100);
  }

  installmentPrice(product: CatalogProduct): number {
    return Math.ceil(product.price / 6);
  }

  addToCart(product: CatalogProduct): void {
    this.selectedProduct.set(product);
    this.cartCount.update((count) => count + 1);
  }

  private sortProducts(products: CatalogProduct[], sort: CatalogSort): CatalogProduct[] {
    const sortedProducts = [...products];

    if (sort === 'priceAsc') {
      return sortedProducts.sort((first, second) => first.price - second.price);
    }

    if (sort === 'priceDesc') {
      return sortedProducts.sort((first, second) => second.price - first.price);
    }

    if (sort === 'rating') {
      return sortedProducts.sort((first, second) => second.rating - first.rating);
    }

    return sortedProducts.sort((first, second) => {
      const stockScore = Number(second.stock > 0) - Number(first.stock > 0);

      if (stockScore !== 0) {
        return stockScore;
      }

      return this.discountValue(second) - this.discountValue(first);
    });
  }

  private ensureSelectedProductIsVisible(): void {
    const current = this.selectedProduct();
    const filtered = this.filteredProducts();

    if (!current || !filtered.some((product) => product.id === current.id)) {
      this.selectedProduct.set(filtered[0] ?? null);
    }
  }

  private refreshFilters(): void {
    this.filtersVersion.update((value) => value + 1);
  }
}
