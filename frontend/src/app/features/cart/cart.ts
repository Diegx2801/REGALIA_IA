import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { AuthSessionService } from '../../core/services/auth/auth-session.service';
import { CartService } from '../../core/services/cart/cart.service';
import {
  DeliveryTypeApiDto,
  InitialPaymentOptionApiDto,
} from '../../core/services/data-access/orders/models/order-api.model';
import { OrderCheckoutApiService } from '../../core/services/data-access/orders/services/order-checkout-api.service';
import { PaymentCheckoutApiService } from '../../core/services/data-access/payments/services/payment-checkout-api.service';

type CheckoutMode = 'cart' | 'confirmation';

interface CheckoutDraft {
  idTipoEntrega: number | null;
  codigoTipoPago: string;
  fechaEntrega: string;
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
  private static readonly FULL_PAYMENT_CODE = 'PAGO_COMPLETO';
  private static readonly PAYMENT_START_ERROR =
    'No pudimos iniciar el pago seguro. Intenta nuevamente en unos minutos.';
  private static readonly CHECKOUT_OPTIONS_ERROR =
    'No pudimos cargar las opciones de reserva. Actualiza la pagina e intenta nuevamente.';

  private readonly authSession = inject(AuthSessionService);
  private readonly cartService = inject(CartService);
  private readonly orderCheckoutApi = inject(OrderCheckoutApiService);
  private readonly paymentCheckoutApi = inject(PaymentCheckoutApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

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
  readonly isCreatingPaymentSession = signal(false);
  readonly summary = this.cartService.summary;
  readonly hasCheckoutContent = computed(() => this.hasItems());
  readonly primaryCheckoutLabel = computed(() =>
    this.isLoggedIn() ? 'Revisar condiciones' : 'Iniciar sesion para reservar',
  );
  readonly selectedPaymentOption = computed(() =>
    this.paymentOptions().find((option) => option.codigo === this.checkoutDraft().codigoTipoPago),
  );
  readonly initialPaymentLabel = computed(() =>
    this.checkoutDraft().codigoTipoPago === CartComponent.FULL_PAYMENT_CODE
      ? 'Pago online'
      : this.selectedPaymentOption()?.nombre || 'Pago inicial',
  );
  readonly initialPaymentAmount = computed(() =>
    this.checkoutDraft().codigoTipoPago === CartComponent.FULL_PAYMENT_CODE
      ? this.summary().subtotal
      : this.summary().reservation,
  );
  readonly remainingPaymentAmount = computed(() =>
    this.checkoutDraft().codigoTipoPago === CartComponent.FULL_PAYMENT_CODE
      ? 0
      : this.summary().remainingToPay,
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

  startMercadoPagoCheckout(): void {
    if (!this.ensureCheckoutSession()) return;
    if (!this.ensureSingleStore()) return;

    const validationError = this.validateGatewayCheckoutDraft();
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
    this.isCreatingPaymentSession.set(true);

    this.paymentCheckoutApi
      .createSession({
        provider: 'MERCADO_PAGO',
        idTienda,
        idTipoEntrega: draft.idTipoEntrega as number,
        codigoTipoPago: draft.codigoTipoPago,
        fechaEntrega: draft.fechaEntrega,
        observacion: draft.observacion.trim() || null,
        items: this.items().map((item) => ({
          idProducto: item.product.id,
          cantidad: item.quantity,
        })),
      })
      .pipe(finalize(() => this.isCreatingPaymentSession.set(false)))
      .subscribe({
        next: (session) => {
          if (!session.redirectUrl) {
            this.checkoutMessage.set(CartComponent.PAYMENT_START_ERROR);
            return;
          }

          window.location.href = session.redirectUrl;
        },
        error: () => {
          this.checkoutMessage.set(CartComponent.PAYMENT_START_ERROR);
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

  updateDeliveryDate(value: string): void {
    this.checkoutDraft.update((draft) => ({
      ...draft,
      fechaEntrega: value,
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
        error: () => {
          this.checkoutMessage.set(CartComponent.CHECKOUT_OPTIONS_ERROR);
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

  private validateGatewayCheckoutDraft(): string | null {
    const draft = this.checkoutDraft();

    if (!this.hasItems()) return 'Agrega al menos un producto antes de iniciar el pago.';
    if (!draft.idTipoEntrega) return 'Selecciona el tipo de entrega.';
    if (!draft.codigoTipoPago) return 'Selecciona la modalidad de pago inicial.';
    if (!draft.fechaEntrega) return 'Selecciona la fecha de entrega.';
    if (draft.fechaEntrega < this.minDeliveryDate) {
      return 'La fecha de entrega no puede ser anterior a hoy.';
    }

    return null;
  }

  private initialCheckoutDraft(): CheckoutDraft {
    return {
      idTipoEntrega: null,
      codigoTipoPago: '',
      fechaEntrega: this.minDeliveryDate,
      observacion: '',
    };
  }

  private todayAsInputDate(): string {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${today.getFullYear()}-${month}-${day}`;
  }
}
