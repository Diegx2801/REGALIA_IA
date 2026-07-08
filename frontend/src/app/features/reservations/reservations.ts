import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { OrderApiDto, OrderDetailApiDto } from '../../core/services/data-access/orders/models/order-api.model';
import { OrderApiService } from '../../core/services/data-access/orders/services/order-api.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

type ClientReservationFilter = 'TODOS' | 'ACTIVAS' | 'PAGADAS' | 'CON_SALDO';
type ReservationTone = 'neutral' | 'success' | 'warning' | 'error';

interface ClientReservationMetric {
  label: string;
  value: string;
  helper: string;
}

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css',
})
export class ReservationsComponent implements OnInit {
  private readonly orderApi = inject(OrderApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<OrderApiDto[]>([]);
  readonly selectedOrderId = signal<number | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly activeFilter = signal<ClientReservationFilter>('TODOS');

  readonly filters: Array<{ value: ClientReservationFilter; label: string }> = [
    { value: 'TODOS', label: 'Todas' },
    { value: 'ACTIVAS', label: 'Activas' },
    { value: 'PAGADAS', label: 'Pagadas' },
    { value: 'CON_SALDO', label: 'Con saldo' },
  ];

  readonly filteredOrders = computed(() => {
    const filter = this.activeFilter();
    const orders = this.orders();

    if (filter === 'ACTIVAS') {
      return orders.filter((order) => order.estado && this.getRemainingAmount(order) > 0);
    }

    if (filter === 'PAGADAS') {
      return orders.filter((order) => this.getRemainingAmount(order) <= 0);
    }

    if (filter === 'CON_SALDO') {
      return orders.filter((order) => this.getRemainingAmount(order) > 0);
    }

    return orders;
  });

  readonly selectedOrder = computed(() => {
    const selectedOrderId = this.selectedOrderId();
    return this.orders().find((order) => order.idPedido === selectedOrderId) ?? null;
  });

  readonly metrics = computed<ClientReservationMetric[]>(() => {
    const orders = this.orders();
    const activeOrders = orders.filter((order) => order.estado);
    const paidOrders = orders.filter((order) => this.getRemainingAmount(order) <= 0);
    const pendingBalance = orders.reduce((sum, order) => sum + this.getRemainingAmount(order), 0);

    return [
      {
        label: 'Reservas',
        value: String(orders.length),
        helper: `${activeOrders.length} activas`,
      },
      {
        label: 'Pagadas',
        value: String(paidOrders.length),
        helper: 'Sin saldo pendiente',
      },
      {
        label: 'Saldo pendiente',
        value: this.formatCurrency(pendingBalance),
        helper: 'Por pagar al recibir',
      },
      {
        label: 'Total reservado',
        value: this.formatCurrency(orders.reduce((sum, order) => sum + this.getTotalAmount(order), 0)),
        helper: 'Historial visible',
      },
    ];
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.orderApi
      .getMyOrders()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.errorMessage.set('No se pudieron cargar tus reservas.');
          return of([]);
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe((orders) => {
        this.orders.set(orders);
        this.syncSelectedOrder(orders);
      });
  }

  setFilter(filter: ClientReservationFilter): void {
    this.activeFilter.set(filter);
    this.syncSelectedOrder(this.filteredOrders());
  }

  clearFilter(): void {
    this.setFilter('TODOS');
  }

  selectOrder(order: OrderApiDto): void {
    this.selectedOrderId.set(order.idPedido);
  }

  trackOrder(_: number, order: OrderApiDto): number {
    return order.idPedido;
  }

  trackDetail(_: number, detail: OrderDetailApiDto): number {
    return detail.idDetallePedido;
  }

  orderStatusLabel(order: OrderApiDto): string {
    return this.toReadableLabel(order.estadoPedido);
  }

  paymentLabel(order: OrderApiDto): string {
    const paidAmount = this.getPaidAmount(order);
    const remainingAmount = this.getRemainingAmount(order);

    if (remainingAmount <= 0) {
      return 'Pagado';
    }

    if (paidAmount > 0) {
      return 'Inicial pagado';
    }

    return 'Pago pendiente';
  }

  paymentTone(order: OrderApiDto): ReservationTone {
    const paidAmount = this.getPaidAmount(order);
    const remainingAmount = this.getRemainingAmount(order);

    if (remainingAmount <= 0) {
      return 'success';
    }

    if (paidAmount > 0) {
      return 'warning';
    }

    return 'error';
  }

  formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('es-PE', {
      currency: 'PEN',
      style: 'currency',
    }).format(Number(value ?? 0));
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return 'No registrada';
    }

    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${value}T12:00:00`));
  }

  getTotalAmount(order: OrderApiDto): number {
    return Number(order.total ?? order.subtotal ?? 0);
  }

  getPaidAmount(order: OrderApiDto): number {
    return Number(order.montoPagado ?? 0);
  }

  getRemainingAmount(order: OrderApiDto): number {
    return Number(order.saldoPendiente ?? 0);
  }

  private syncSelectedOrder(orders: OrderApiDto[]): void {
    const currentOrderId = this.selectedOrderId();
    const hasCurrentOrder = currentOrderId
      ? orders.some((order) => order.idPedido === currentOrderId)
      : false;

    this.selectedOrderId.set(hasCurrentOrder ? currentOrderId : (orders[0]?.idPedido ?? null));
  }

  private toReadableLabel(value: string | null | undefined): string {
    if (!value) {
      return 'No registrado';
    }

    return value
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/^\w/, (firstLetter) => firstLetter.toUpperCase());
  }
}
