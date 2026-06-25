import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart/cart.service';
import { RegaliaService } from '../../core/services/data-access/regalia/regalia.service';
import { RegaliaPublicCatalogApiService } from '../../core/services/data-access/regalia/services/regalia-public-catalog-api.service';
import { FixedPriceProduct } from '../../shared/models/regalia.model';

type ProductDetailLoadState = 'loading' | 'ready' | 'fallback' | 'notFound' | 'error';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetailComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly regaliaService = inject(RegaliaService);
  private readonly publicCatalogApiService = inject(RegaliaPublicCatalogApiService);
  private readonly cartService = inject(CartService);

  readonly productId = Number(this.route.snapshot.paramMap.get('id'));
  readonly product = signal<FixedPriceProduct | null>(null);
  readonly relatedProducts = signal<FixedPriceProduct[]>([]);
  readonly detailLoadState = signal<ProductDetailLoadState>('loading');
  readonly quantity = signal(1);
  readonly wasAdded = signal(false);
  readonly subtotal = computed(() =>
    this.roundMoney((this.product()?.price ?? 0) * this.quantity()),
  );

  ngOnInit(): void {
    if (!Number.isInteger(this.productId) || this.productId <= 0) {
      this.detailLoadState.set('notFound');
      return;
    }

    const cachedProduct = this.regaliaService.getFixedPriceProductById(this.productId);
    if (cachedProduct) {
      this.applyProduct(cachedProduct);
      this.detailLoadState.set('ready');
    }

    this.publicCatalogApiService
      .getPublicProductById(this.productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (product) => {
          this.regaliaService.upsertRuntimeFixedPriceProduct(product);
          this.applyProduct(product);
          this.detailLoadState.set('ready');
        },
        error: (error: unknown) => {
          if (this.isNotFound(error)) {
            this.product.set(null);
            this.relatedProducts.set([]);
            this.detailLoadState.set('notFound');
            return;
          }

          if (cachedProduct) {
            this.detailLoadState.set('fallback');
            return;
          }

          this.detailLoadState.set('error');
        },
      });
  }

  increase(): void {
    const product = this.product();
    if (!product) return;
    this.wasAdded.set(false);
    this.quantity.update((value) => Math.min(value + 1, product.maxQuantity));
  }

  decrease(): void {
    this.wasAdded.set(false);
    this.quantity.update((value) => Math.max(1, value - 1));
  }

  addToCart(): void {
    const product = this.product();
    if (!product) return;
    this.cartService.addProduct(product, this.quantity());
    this.wasAdded.set(true);
  }

  addRelatedProduct(productId: number): void {
    const product = this.regaliaService.getFixedPriceProductById(productId);
    if (!product) return;
    this.cartService.addProduct(product);
  }

  trackText(_: number, value: string): string {
    return value;
  }

  trackProduct(_: number, product: { id: number }): number {
    return product.id;
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private applyProduct(product: FixedPriceProduct): void {
    this.product.set(product);
    this.relatedProducts.set(
      this.regaliaService
        .getFixedPriceProducts()
        .filter((item) => item.id !== product.id)
        .slice(0, 3),
    );
  }

  private isNotFound(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 404;
  }
}
