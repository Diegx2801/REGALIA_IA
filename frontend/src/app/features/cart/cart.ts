import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartComponent {
  private readonly cartService = inject(CartService);

  readonly items = this.cartService.items;
  readonly summary = this.cartService.summary;
  readonly hasItems = this.cartService.hasItems;
  readonly checkoutMode = signal<'review' | 'sent'>('review');
  readonly deliveryNote = computed(() =>
    this.items().length === 1
      ? 'El proveedor confirmará personalización, hora y dirección antes de preparar el pedido.'
      : 'REGALIA coordinará cada producto con su proveedor para confirmar horarios y personalización.',
  );

  updateQuantity(productId: number, value: string): void {
    this.checkoutMode.set('review');
    this.cartService.updateQuantity(productId, Number(value));
  }

  increase(productId: number, currentQuantity: number): void {
    this.checkoutMode.set('review');
    this.cartService.updateQuantity(productId, currentQuantity + 1);
  }

  decrease(productId: number, currentQuantity: number): void {
    this.checkoutMode.set('review');
    this.cartService.updateQuantity(productId, currentQuantity - 1);
  }

  remove(productId: number): void {
    this.checkoutMode.set('review');
    this.cartService.removeProduct(productId);
  }

  clear(): void {
    this.checkoutMode.set('review');
    this.cartService.clearCart();
  }

  confirmReservation(): void {
    this.checkoutMode.set('sent');
  }

  trackItem(_: number, item: { product: { id: number } }): number {
    return item.product.id;
  }
}
