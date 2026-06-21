import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart/cart.service';
import { RegaliaService } from '../../core/services/data-access/regalia/regalia.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly regaliaService = inject(RegaliaService);
  private readonly cartService = inject(CartService);

  readonly productId = Number(this.route.snapshot.paramMap.get('id'));
  readonly product = this.regaliaService.getFixedPriceProductById(this.productId);
  readonly relatedProducts = this.regaliaService
    .getFixedPriceProducts()
    .filter((product) => product.id !== this.productId)
    .slice(0, 3);
  readonly quantity = signal(1);
  readonly wasAdded = signal(false);
  readonly subtotal = computed(() => this.roundMoney((this.product?.price ?? 0) * this.quantity()));

  increase(): void {
    if (!this.product) return;
    this.wasAdded.set(false);
    this.quantity.update((value) => Math.min(value + 1, this.product?.maxQuantity ?? value));
  }

  decrease(): void {
    this.wasAdded.set(false);
    this.quantity.update((value) => Math.max(1, value - 1));
  }

  addToCart(): void {
    if (!this.product) return;
    this.cartService.addProduct(this.product, this.quantity());
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
}
