import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { AuthSessionService } from '../../core/services/auth/auth-session.service';
import { CartService } from '../../core/services/cart/cart.service';
import {
  DeliveryTypeApiDto,
  InitialPaymentOptionApiDto,
  OrderApiDto,
} from '../../core/services/data-access/orders/models/order-api.model';
import { OrderCheckoutApiService } from '../../core/services/data-access/orders/services/order-checkout-api.service';
import { CartSummary } from '../../shared/models/regalia.model';

type CheckoutMode = 'cart' | 'confirmation' | 'sent';

interface CheckoutDraft {
  idTipoEntrega: number | null;
  codigoTipoPago: string;
  fechaEntrega: string;
  metodoPagoPasarela: string;
  codigoTransaccion: string;
  observacion: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartComponent implements OnInit {
  private static readonly CHECKOUT_RETURN_URL = '/carrito?checkout=confirmacion';

  private readonly authSession = inject(AuthSessionService);
  private readonly cartService = inject(CartService);
  private readonly orderCheckoutApi = inject(OrderCheckoutApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly paymentMethods = ['YAPE', 'PLIN', 'TRANSFERENCIA'] as const;
  readonly minDeliveryDate = this.todayAsInputDate();
  readonly items = this.cartService.items;
  readonly hasItems = this.cartService.hasItems;
  readonly hasMultipleStores = this.cartService.hasMultipleStores;
  readonly isLoggedIn = this.authSession.isLoggedIn;
  readonly checkoutMode = signal<CheckoutMode>('cart');
  readonly checkoutMessage = signal('');
  readonly checkoutDraft = signal<CheckoutDraft>(this.initialCheckoutDraft());
  readonly deliveryOptions = signal<DeliveryTypeApiDto[]>([]);
  readonly paymentOptions = signal<InitialPaymentOptionApiDto[]>([]);
  readonly isLoadingCheckoutOptions = signal(false);
  readonly isSubmittingOrder = signal(false);
  readonly submittedOrder = signal<OrderApiDto | null>(null);
  readonly submittedSummary = signal<CartSummary | null>(null);
  readonly summary = computed(() => this.submittedSummary() ?? this.cartService.summary());
  readonly hasCheckoutContent = computed(() => this.hasItems() || this.submittedOrder() !== null);
  readonly primaryCheckoutLabel = computed(() =>
    this.isLoggedIn() ? 'Revisar condiciones' : 'Iniciar sesion para reservar',
  );
  readonly deliveryNote = computed(() =>
    this.items().length === 1
      ? 'El vendedor confirmara personalizacion, hora y direccion antes de preparar el pedido.'
      : 'REGALIA coordinara cada producto con su vendedor para confirmar horarios y personalizacion.',
  );

  ngOnInit(): void {
    const checkoutStep = this.route.snapshot.queryParamMap.get('checkout');

    if (checkoutStep === 'confirmacion' && this.hasItems()) {
      this.reviewReservation();
    }
  }

  updateQuantity(productId: number, value: string): void {
    this.resetCheckoutDraft();
    this.cartService.updateQuantity(productId, Number(value));
  }

  increase(productId: number, currentQuantity: number): void {
    this.resetCheckoutDraft();
    this.cartService.updateQuantity(productId, currentQuantity + 1);
  }

  decrease(productId: number, currentQuantity: number): void {
    this.resetCheckoutDraft();
    this.cartService.updateQuantity(productId, currentQuantity - 1);
  }

  remove(productId: number): void {
    this.resetCheckoutDraft();
    this.cartService.removeProduct(productId);
  }

  clear(): void {
    this.resetCheckoutDraft();
    this.cartService.clearCart();
  }

  reviewReservation(): void {
    if (!this.ensureCheckoutSession()) return;
    if (!this.ensureSingleStore()) return;

    this.checkoutMode.set('confirmation');
    this.loadCheckoutOptions();
  }

  backToCart(): void {
    this.resetCheckoutDraft();
  }

  confirmReservation(): void {
    if (!this.ensureCheckoutSession()) return;
    if (!this.ensureSingleStore()) return;

    const validationError = this.validateCheckoutDraft();
    if (validationError) {
      this.checkoutMessage.set(validationError);
      return;
    }

    const draft = this.checkoutDraft();
    const idTienda = this.cartService.currentStoreId();
    if (idTienda === null) {
      this.checkoutMessage.set('No se pudo identificar la tienda del pedido.');
      return;
    }

    this.checkoutMessage.set('');
    this.isSubmittingOrder.set(true);

    this.orderCheckoutApi
      .confirmOrder({
        idTienda,
        idTipoEntrega: draft.idTipoEntrega as number,
        codigoTipoPago: draft.codigoTipoPago,
        fechaEntrega: draft.fechaEntrega,
        observacion: draft.observacion.trim() || null,
        metodoPagoPasarela: draft.metodoPagoPasarela,
        codigoTransaccion: draft.codigoTransaccion.trim(),
        items: this.items().map((item) => ({
          idProducto: item.product.id,
          cantidad: item.quantity,
        })),
      })
      .pipe(finalize(() => this.isSubmittingOrder.set(false)))
      .subscribe({
        next: (order) => {
          this.submittedSummary.set(this.cartService.summary());
          this.submittedOrder.set(order);
          this.checkoutMode.set('sent');
          this.cartService.clearCart();
        },
        error: (error: unknown) => {
          this.checkoutMessage.set(this.errorMessage(error));
        },
      });
  }

  updateDeliveryType(value: string): void {
    this.checkoutDraft.update((draft) => ({
      ...draft,
      idTipoEntrega: Number(value) || null,
    }));
  }

  updatePaymentOption(value: string): void {
    this.checkoutDraft.update((draft) => ({
      ...draft,
      codigoTipoPago: value,
    }));
  }

  updatePaymentMethod(value: string): void {
    this.checkoutDraft.update((draft) => ({
      ...draft,
      metodoPagoPasarela: value,
    }));
  }

  updateDeliveryDate(value: string): void {
    this.checkoutDraft.update((draft) => ({
      ...draft,
      fechaEntrega: value,
    }));
  }

  updateTransactionCode(value: string): void {
    this.checkoutDraft.update((draft) => ({
      ...draft,
      codigoTransaccion: value,
    }));
  }

  updateObservation(value: string): void {
    this.checkoutDraft.update((draft) => ({
      ...draft,
      observacion: value,
    }));
  }

  trackItem(_: number, item: { product: { id: number } }): number {
    return item.product.id;
  }

  private resetCheckoutDraft(): void {
    this.checkoutMode.set('cart');
    this.checkoutMessage.set('');
    this.submittedOrder.set(null);
    this.submittedSummary.set(null);
  }

  private ensureCheckoutSession(): boolean {
    this.checkoutMessage.set('');

    if (!this.authSession.isLoggedIn()) {
      void this.router.navigate(['/login'], {
        queryParams: {
          returnUrl: CartComponent.CHECKOUT_RETURN_URL,
        },
      });

      return false;
    }

    if (!this.authSession.hasAuthContext('PUBLIC')) {
      this.checkoutMessage.set(
        'Para reservar productos inicia sesion con una cuenta de cliente o vendedor, no con una cuenta administrativa.',
      );

      return false;
    }

    return true;
  }

  private ensureSingleStore(): boolean {
    if (!this.hasMultipleStores()) return true;

    this.checkoutMessage.set(
      'Por ahora confirma productos de una sola tienda por reserva. Puedes separar el carrito y registrar cada tienda como un pedido distinto.',
    );

    return false;
  }

  private loadCheckoutOptions(): void {
    if (this.deliveryOptions().length > 0 && this.paymentOptions().length > 0) return;
    if (this.isLoadingCheckoutOptions()) return;

    this.isLoadingCheckoutOptions.set(true);
    this.checkoutMessage.set('');

    forkJoin({
      deliveryOptions: this.orderCheckoutApi.getDeliveryTypes(),
      paymentOptions: this.orderCheckoutApi.getInitialPaymentOptions(),
    })
      .pipe(finalize(() => this.isLoadingCheckoutOptions.set(false)))
      .subscribe({
        next: ({ deliveryOptions, paymentOptions }) => {
          this.deliveryOptions.set(deliveryOptions.filter((option) => option.estado));
          this.paymentOptions.set(paymentOptions);
          this.applyDefaultCheckoutOptions(deliveryOptions, paymentOptions);
        },
        error: (error: unknown) => {
          this.checkoutMessage.set(this.errorMessage(error));
        },
      });
  }

  private applyDefaultCheckoutOptions(
    deliveryOptions: DeliveryTypeApiDto[],
    paymentOptions: InitialPaymentOptionApiDto[],
  ): void {
    const activeDeliveryOptions = deliveryOptions.filter((option) => option.estado);
    const defaultPaymentOption =
      paymentOptions.find((option) => option.codigo === 'SENA') ?? paymentOptions[0];

    this.checkoutDraft.update((draft) => ({
      ...draft,
      idTipoEntrega: draft.idTipoEntrega ?? activeDeliveryOptions[0]?.idTipoEntrega ?? null,
      codigoTipoPago: draft.codigoTipoPago || defaultPaymentOption?.codigo || '',
    }));
  }

  private validateCheckoutDraft(): string | null {
    const draft = this.checkoutDraft();

    if (!this.hasItems()) return 'Agrega al menos un producto antes de registrar la reserva.';
    if (!draft.idTipoEntrega) return 'Selecciona el tipo de entrega.';
    if (!draft.codigoTipoPago) return 'Selecciona la modalidad de pago inicial.';
    if (!draft.fechaEntrega) return 'Selecciona la fecha de entrega.';
    if (draft.fechaEntrega < this.minDeliveryDate) {
      return 'La fecha de entrega no puede ser anterior a hoy.';
    }
    if (!draft.metodoPagoPasarela) return 'Selecciona el metodo de pago.';
    if (!draft.codigoTransaccion.trim()) return 'Ingresa el codigo de operacion del pago.';

    return null;
  }

  private initialCheckoutDraft(): CheckoutDraft {
    return {
      idTipoEntrega: null,
      codigoTipoPago: '',
      fechaEntrega: this.minDeliveryDate,
      metodoPagoPasarela: 'YAPE',
      codigoTransaccion: '',
      observacion: '',
    };
  }

  private todayAsInputDate(): string {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${today.getFullYear()}-${month}-${day}`;
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return (
        error.error?.message ||
        'No se pudo registrar la reserva. Revisa los datos del pago inicial.'
      );
    }

    return 'No se pudo registrar la reserva. Intenta nuevamente.';
  }
}
