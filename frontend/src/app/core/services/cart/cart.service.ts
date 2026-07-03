import { Injectable, computed, signal } from '@angular/core';
import { CartItem, CartSummary, FixedPriceProduct } from '../../../shared/models/regalia.model';

const CART_STORAGE_KEY = 'regalia_fixed_price_cart_v1';
const RESERVATION_RATE = 0.2;
const PLATFORM_RATE_FROM_RESERVATION = 0.3;

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsSignal = signal<CartItem[]>(this.restoreCart());

  readonly items = this.itemsSignal.asReadonly();
  readonly totalItems = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));
  readonly hasItems = computed(() => this.totalItems() > 0);
  readonly storeIds = computed(() => [
    ...new Set(this.items().map((item) => item.product.providerId).filter(Boolean)),
  ]);
  readonly currentStoreId = computed(() => this.storeIds()[0] ?? null);
  readonly hasMultipleStores = computed(() => this.storeIds().length > 1);
  readonly summary = computed<CartSummary>(() => this.calculateSummary(this.items()));

  addProduct(product: FixedPriceProduct, quantity = 1): void {
    const safeQuantity = this.normalizeQuantity(quantity, product.maxQuantity);

    this.itemsSignal.update((items) => {
      const existing = items.find((item) => item.product.id === product.id);

      if (!existing) {
        return this.persist([
          ...items,
          {
            product,
            quantity: safeQuantity,
          },
        ]);
      }

      return this.persist(
        items.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: this.normalizeQuantity(item.quantity + safeQuantity, product.maxQuantity),
              }
            : item,
        ),
      );
    });
  }

  updateQuantity(productId: number, quantity: number): void {
    this.itemsSignal.update((items) => {
      const next = items
        .map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity: this.normalizeQuantity(quantity, item.product.maxQuantity),
              }
            : item,
        )
        .filter((item) => item.quantity > 0);

      return this.persist(next);
    });
  }

  removeProduct(productId: number): void {
    this.itemsSignal.update((items) => this.persist(items.filter((item) => item.product.id !== productId)));
  }

  clearCart(): void {
    this.itemsSignal.set(this.persist([]));
  }

  private calculateSummary(items: CartItem[]): CartSummary {
    const subtotal = this.roundMoney(
      items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    );
    const reservation = this.roundMoney(subtotal * RESERVATION_RATE);
    const platformCommission = this.roundMoney(reservation * PLATFORM_RATE_FROM_RESERVATION);
    const providerAdvance = this.roundMoney(reservation - platformCommission);
    const remainingToPay = this.roundMoney(subtotal - reservation);

    return {
      subtotal,
      reservation,
      platformCommission,
      providerAdvance,
      remainingToPay,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  private normalizeQuantity(quantity: number, maxQuantity: number): number {
    const numericQuantity = Number.isFinite(quantity) ? Math.trunc(quantity) : 1;
    return Math.max(0, Math.min(numericQuantity, maxQuantity));
  }

  private persist(items: CartItem[]): CartItem[] {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }

    return items;
  }

  private restoreCart(): CartItem[] {
    if (typeof localStorage === 'undefined') return [];

    try {
      const rawCart = localStorage.getItem(CART_STORAGE_KEY);
      if (!rawCart) return [];

      const parsed = JSON.parse(rawCart) as CartItem[];
      if (!Array.isArray(parsed)) return [];

      return parsed.filter((item) => item?.product?.id && item.quantity > 0);
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
