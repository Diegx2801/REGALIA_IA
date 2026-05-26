import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CatalogService } from '../../data-access/catalog/catalog.service';
import { CatalogFilters, CatalogProduct } from '../../shared/models/catalog-product.model';
import { ComponentCategory } from '../../shared/models/pc-build.model';

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
  private readonly filtersVersion = signal(0);

  readonly filtersForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    category: new FormControl<ComponentCategory | 'All'>('All', { nonNullable: true }),
    brand: new FormControl('All', { nonNullable: true }),
    stockOnly: new FormControl(true, { nonNullable: true }),
    maxPrice: new FormControl(3000, { nonNullable: true }),
  });

  readonly filteredProducts = computed(() => {
    this.filtersVersion();
    const filters: CatalogFilters = this.filtersForm.getRawValue();
    return this.catalogService.filterProducts(filters);
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
