import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { OrderApiDto, OrderDetailApiDto } from '../../core/services/data-access/orders/models/order-api.model';
import { AdminOrderApiService } from '../../core/services/data-access/orders/services/admin-order-api.service';

type AdminOrderFilter = 'TODOS' | 'ACTIVOS' | 'PAGADOS' | 'CON_SALDO';

interface AdminOrderFilterOption {
  value: AdminOrderFilter;
  label: string;
}

const FILTER_OPTIONS: AdminOrderFilterOption[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'ACTIVOS', label: 'Activos' },
  { value: 'PAGADOS', label: 'Pagados' },
  { value: 'CON_SALDO', label: 'Con saldo' },
];

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css',
})
export class AdminOrdersComponent implements OnInit {
  private readonly adminOrderApi = inject(AdminOrderApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly filterOptions = FILTER_OPTIONS;
  readonly filter = signal<AdminOrderFilter>('TODOS');
  readonly searchTerm = signal('');
  readonly orders = signal<OrderApiDto[]>([]);
  readonly selectedOrderId = signal<number | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  readonly filteredOrders = computed(() => {
    const normalizedSearch = this.normalize(this.searchTerm());
    const currentFilter = this.filter();

    return this.orders().filter((order) => {
      const matchesFilter = this.matchesFilter(order, currentFilter);
      const matchesSearch =
        normalizedSearch.length === 0 ||
        this.normalize(
          [
            order.idPedido,
            order.idUsuario,
            order.nombreTienda,
            order.tipoEntrega,
            order.estadoPedido,
            order.observacion,
          ].join(' '),
        ).includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  });

  readonly selectedOrder = computed(() => {
    const filteredOrders = this.filteredOrders();
    const selectedOrderId = this.selectedOrderId();

    return (
      filteredOrders.find((order) => order.idPedido === selectedOrderId) ??
      filteredOrders[0] ??
      null
    );
  });

  readonly totalCount = computed(() => this.orders().length);
  readonly activeCount = computed(() => this.orders().filter((order) => Boolean(order.estado)).length);
  readonly paidCount = computed(
    () => this.orders().filter((order) => this.toNumber(order.saldoPendiente) <= 0).length,
  );
  readonly pendingBalanceCount = computed(
    () => this.orders().filter((order) => this.toNumber(order.saldoPendiente) > 0).length,
  );
  readonly totalPaid = computed(() =>
    this.orders().reduce((sum, order) => sum + this.toNumber(order.montoPagado), 0),
  );

  ngOnInit(): void {
    this.loadOrders();
  }

  setFilter(filter: AdminOrderFilter): void {
    this.filter.set(filter);
    this.selectedOrderId.set(null);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.selectedOrderId.set(null);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.selectedOrderId.set(null);
  }

  selectOrder(order: OrderApiDto): void {
    this.selectedOrderId.set(order.idPedido);
  }

  refresh(): void {
    this.loadOrders();
  }

  paymentLabel(order: OrderApiDto): string {
    return this.toNumber(order.saldoPendiente) <= 0 ? 'Pagado' : 'Con saldo';
  }

  paymentTone(order: OrderApiDto): string {
    return this.toNumber(order.saldoPendiente) <= 0 ? 'success' : 'warning';
  }

  orderStatusLabel(order: OrderApiDto): string {
    return order.estadoPedido || 'Sin estado';
  }

  formatCurrency(value: number | null): string {
    return new Intl.NumberFormat('es-PE', {
      currency: 'PEN',
      style: 'currency',
    }).format(this.toNumber(value));
  }

  formatDate(value: string | null): string {
    if (!value) return 'No registrada';

    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
    }).format(new Date(`${value}T00:00:00`));
  }

  formatDateTime(value: string | null): string {
    if (!value) return 'No registrada';

    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  trackOrder(_: number, order: OrderApiDto): number {
    return order.idPedido;
  }

  trackDetail(_: number, detail: OrderDetailApiDto): number {
    return detail.idDetallePedido;
  }

  private loadOrders(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminOrderApi
      .getOrders()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          const selectedOrderStillExists = orders.some(
            (order) => order.idPedido === this.selectedOrderId(),
          );
          if (!selectedOrderStillExists) {
            this.selectedOrderId.set(orders[0]?.idPedido ?? null);
          }
        },
        error: () => {
          this.orders.set([]);
          this.selectedOrderId.set(null);
          this.errorMessage.set('No se pudieron cargar los pedidos administrativos.');
        },
      });
  }

  private matchesFilter(order: OrderApiDto, filter: AdminOrderFilter): boolean {
    if (filter === 'ACTIVOS') return Boolean(order.estado);
    if (filter === 'PAGADOS') return this.toNumber(order.saldoPendiente) <= 0;
    if (filter === 'CON_SALDO') return this.toNumber(order.saldoPendiente) > 0;
    return true;
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private toNumber(value: number | null): number {
    return Number(value ?? 0);
  }
}
