import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AdminOrderPaymentFilterApi,
  AdminOrderSearchFieldApi,
  OrderApiDto,
  OrderDetailApiDto,
} from '../../core/services/data-access/orders/models/order-api.model';
import { AdminOrderApiService } from '../../core/services/data-access/orders/services/admin-order-api.service';

type AdminOrderFilter = 'TODOS' | 'PAGADOS' | 'CON_SALDO';

interface AdminOrderFilterOption {
  value: AdminOrderFilter;
  label: string;
}

const FILTER_OPTIONS: AdminOrderFilterOption[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'PAGADOS', label: 'Pagados' },
  { value: 'CON_SALDO', label: 'Con saldo' },
];

interface AdminOrderSearchFieldOption {
  value: AdminOrderSearchFieldApi;
  label: string;
  placeholder: string;
}

const SEARCH_FIELD_OPTIONS: AdminOrderSearchFieldOption[] = [
  { value: 'ID_PEDIDO', label: 'ID pedido', placeholder: 'Ej. 4' },
  { value: 'NOMBRE_TIENDA', label: 'Tienda', placeholder: 'Ej. Regalia Gifts' },
  { value: 'ID_USUARIO', label: 'ID usuario', placeholder: 'Ej. 3' },
  { value: 'ID_TIENDA', label: 'ID tienda', placeholder: 'Ej. 3' },
  { value: 'ESTADO_PEDIDO', label: 'Estado pedido', placeholder: 'Ej. RESERVADO' },
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly filterOptions = FILTER_OPTIONS;
  readonly searchFieldOptions = SEARCH_FIELD_OPTIONS;
  readonly filter = signal<AdminOrderFilter>('TODOS');
  readonly searchField = signal<AdminOrderSearchFieldApi>('ID_PEDIDO');
  readonly searchTerm = signal('');
  readonly orders = signal<OrderApiDto[]>([]);
  readonly selectedOrderId = signal<number | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  readonly selectedOrder = computed<OrderApiDto | null>(() => {
    const selectedOrderId = this.selectedOrderId();

    return (
      this.orders().find((order) => order.idPedido === selectedOrderId) ??
      this.orders()[0] ??
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
  readonly searchPlaceholder = computed(
    () =>
      this.searchFieldOptions.find((option) => option.value === this.searchField())?.placeholder ??
      'Buscar',
  );

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.filter.set(this.parsePaymentFilter(params.get('estadoPago')));
      this.searchField.set(this.parseSearchField(params.get('searchField')));
      this.searchTerm.set(params.get('search') ?? '');
      this.selectedOrderId.set(null);
      this.loadOrders();
    });
  }

  setFilter(filter: AdminOrderFilter): void {
    this.updateQueryParams({
      estadoPago: this.paymentFilterToApi(filter) ?? null,
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.updateQueryParams({ search: input.value.trim() || null });
  }

  onSearchFieldChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.updateQueryParams({
      searchField: this.parseSearchField(select.value),
      search: this.searchTerm().trim() || null,
    });
  }

  clearSearch(): void {
    this.updateQueryParams({ search: null });
  }

  selectOrder(order: OrderApiDto): void {
    this.selectedOrderId.set(order.idPedido);
  }

  isSelectedOrder(order: OrderApiDto): boolean {
    return this.selectedOrder()?.idPedido === order.idPedido;
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
      .getOrders({
        estadoPago: this.paymentFilterToApi(this.filter()),
        searchField: this.searchField(),
        search: this.searchTerm(),
      })
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.selectedOrderId.set(orders[0]?.idPedido ?? null);
        },
        error: () => {
          this.orders.set([]);
          this.selectedOrderId.set(null);
          this.errorMessage.set('No se pudieron cargar los pedidos administrativos.');
        },
      });
  }

  private parsePaymentFilter(value: string | null): AdminOrderFilter {
    if (value === 'PAGADO') return 'PAGADOS';
    if (value === 'CON_SALDO') return 'CON_SALDO';
    return 'TODOS';
  }

  private paymentFilterToApi(filter: AdminOrderFilter): AdminOrderPaymentFilterApi | undefined {
    if (filter === 'PAGADOS') return 'PAGADO';
    if (filter === 'CON_SALDO') return 'CON_SALDO';
    return undefined;
  }

  private parseSearchField(value: string | null): AdminOrderSearchFieldApi {
    if (
      value === 'NOMBRE_TIENDA' ||
      value === 'ID_USUARIO' ||
      value === 'ID_TIENDA' ||
      value === 'ESTADO_PEDIDO'
    ) {
      return value;
    }

    return 'ID_PEDIDO';
  }

  private updateQueryParams(queryParams: Record<string, string | null | undefined>): void {
    void this.router.navigate([], {
      queryParams,
      queryParamsHandling: 'merge',
      relativeTo: this.route,
      replaceUrl: true,
    });
  }

  private toNumber(value: number | null): number {
    return Number(value ?? 0);
  }
}
