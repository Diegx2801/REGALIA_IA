import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart/cart.service';
import { RegaliaService } from '../../core/services/data-access/regalia/regalia.service';
import {
  FixedPriceProduct,
  ProviderFilter,
  RegaliaCategory,
  RegaliaOccasion,
  RegaliaProvider,
} from '../../shared/models/regalia.model';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class CatalogComponent {
  private readonly regaliaService = inject(RegaliaService);
  private readonly cartService = inject(CartService);

  readonly categories: Array<RegaliaCategory | 'Todas'> = ['Todas', ...this.regaliaService.getCategories()];
  readonly occasions: Array<RegaliaOccasion | 'Todas'> = ['Todas', ...this.regaliaService.getOccasions()];
  readonly providers = signal(this.regaliaService.getProviders());
  readonly selectedProvider = signal<RegaliaProvider>(this.providers()[0]);
  readonly addedProductId = signal<number | null>(null);
  readonly cartTotalItems = this.cartService.totalItems;
  private readonly filtersVersion = signal(0);

  readonly filtersForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    category: new FormControl<RegaliaCategory | 'Todas'>('Todas', { nonNullable: true }),
    occasion: new FormControl<RegaliaOccasion | 'Todas'>('Todas', { nonNullable: true }),
    maxPrice: new FormControl(300, { nonNullable: true }),
    availableOnly: new FormControl(true, { nonNullable: true }),
  });

  readonly currentFilters = computed<ProviderFilter>(() => {
    this.filtersVersion();
    return this.filtersForm.getRawValue();
  });

  readonly filteredProducts = computed(() => this.regaliaService.filterFixedPriceProducts(this.currentFilters()));
  readonly filteredProviders = computed(() => this.regaliaService.filterProviders(this.currentFilters()));

  /**
   * Mantiene sincronizadas las píldoras de categoría y el selector del formulario,
   * conservando el detalle del proveedor seleccionado cuando sigue visible.
   */
  applyCategory(category: RegaliaCategory | 'Todas'): void {
    this.filtersForm.controls.category.setValue(category);
    this.refreshFilters();
    this.ensureSelectedProviderIsVisible();
  }

  selectProvider(provider: RegaliaProvider): void {
    this.selectedProvider.set(provider);
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
    this.selectedProvider.set(this.providers()[0]);
  }

  onFiltersChanged(): void {
    this.refreshFilters();
    this.ensureSelectedProviderIsVisible();
  }

  trackProvider(_: number, provider: RegaliaProvider): number {
    return provider.id;
  }

  trackProduct(_: number, product: FixedPriceProduct): number {
    return product.id;
  }

  trackText(_: number, value: string): string {
    return value;
  }

  private ensureSelectedProviderIsVisible(): void {
    const selected = this.selectedProvider();
    const visible = this.filteredProviders();

    if (!visible.some((provider) => provider.id === selected.id)) {
      this.selectedProvider.set(visible[0] ?? this.providers()[0]);
    }
  }

  private refreshFilters(): void {
    this.filtersVersion.update((value) => value + 1);
  }
}
