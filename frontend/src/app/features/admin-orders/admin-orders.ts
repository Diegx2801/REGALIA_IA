import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AdminOrderPaymentFilterApi,
  AdminOrderSearchFieldApi,
  AdminOrderSortApi,
  OrderApiDto,
  OrderDetailApiDto,
} from '../../core/services/data-access/orders/models/order-api.model';
import { AdminOrderApiService } from '../../core/services/data-access/orders/services/admin-order-api.service';
import { PageApiDto } from '../../shared/models/api-response.model';

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

interface AdminOrderSortOption {
  value: AdminOrderSortApi;
  label: string;
}

const SEARCH_FIELD_OPTIONS: AdminOrderSearchFieldOption[] = [
  { value: 'ID_PEDIDO', label: 'ID pedido', placeholder: 'Ej. 4' },
  { value: 'NOMBRE_TIENDA', label: 'Tienda', placeholder: 'Ej. Regalia Gifts' },
  { value: 'ID_USUARIO', label: 'ID usuario', placeholder: 'Ej. 3' },
  { value: 'ID_TIENDA', label: 'ID tienda', placeholder: 'Ej. 3' },
  { value: 'ESTADO_PEDIDO', label: 'Estado pedido', placeholder: 'Ej. RESERVADO' },
];

const SORT_OPTIONS: AdminOrderSortOption[] = [
  { value: 'fechaCreacion,desc', label: 'Mas recientes' },
  { value: 'fechaCreacion,asc', label: 'Mas antiguos' },
  { value: 'idPedido,desc', label: 'ID mayor' },
  { value: 'idPedido,asc', label: 'ID menor' },
  { value: 'fechaEntrega,asc', label: 'Entrega proxima' },
  { value: 'total,desc', label: 'Mayor total' },
  { value: 'saldoPendiente,desc', label: 'Mayor saldo' },
  { value: 'nombreTienda,asc', label: 'Tienda A-Z' },
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
  readonly sortOptions = SORT_OPTIONS;
  readonly filter = signal<AdminOrderFilter>('TODOS');
  readonly searchField = signal<AdminOrderSearchFieldApi>('ID_PEDIDO');
  readonly searchTerm = signal('');
  readonly page = signal(0);
  readonly pageSize = signal(10);
  readonly sort = signal<AdminOrderSortApi>('fechaCreacion,desc');
  readonly pageInfo = signal<PageApiDto<OrderApiDto> | null>(null);
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

  readonly totalCount = computed(() => this.pageInfo()?.totalElementos ?? this.orders().length);
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
  readonly currentPage = computed(() => this.pageInfo()?.paginaActual ?? this.page());
  readonly totalPages = computed(() => this.pageInfo()?.totalPaginas ?? 0);
  readonly displayedCount = computed(() => this.orders().length);
  readonly isFirstPage = computed(() => this.currentPage() <= 0);
  readonly isLastPage = computed(() => this.pageInfo()?.ultimaPagina ?? true);

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.filter.set(this.parsePaymentFilter(params.get('estadoPago')));
      this.searchField.set(this.parseSearchField(params.get('searchField')));
      this.searchTerm.set(params.get('search') ?? '');
      this.page.set(this.parseNonNegativeInteger(params.get('page'), 0));
      this.pageSize.set(this.parsePageSize(params.get('size')));
      this.sort.set(this.parseSort(params.get('sort')));
      this.selectedOrderId.set(null);
      this.loadOrders();
    });
  }

  setFilter(filter: AdminOrderFilter): void {
    this.updateQueryParams({
      estadoPago: this.paymentFilterToApi(filter) ?? null,
      page: '0',
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.updateQueryParams({
      search: input.value.trim() || null,
      page: '0',
    });
  }

  onSearchFieldChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.updateQueryParams({
      searchField: this.parseSearchField(select.value),
      search: this.searchTerm().trim() || null,
      page: '0',
    });
  }

  clearSearch(): void {
    this.updateQueryParams({ search: null, page: '0' });
  }

  onSortChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.updateQueryParams({
      sort: this.parseSort(select.value),
      page: '0',
    });
  }

  goToPreviousPage(): void {
    if (this.isFirstPage()) {
      return;
    }

    this.updateQueryParams({ page: String(this.currentPage() - 1) });
  }

  goToNextPage(): void {
    if (this.isLastPage()) {
      return;
    }

    this.updateQueryParams({ page: String(this.currentPage() + 1) });
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
        page: this.page(),
        size: this.pageSize(),
        sort: this.sort(),
      })
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pageData) => {
          this.pageInfo.set(pageData);
          this.orders.set(pageData.contenido);
          this.selectedOrderId.set(pageData.contenido[0]?.idPedido ?? null);
        },
        error: () => {
          this.pageInfo.set(null);
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

  private parseSort(value: string | null): AdminOrderSortApi {
    const normalizedValue = value as AdminOrderSortApi;

    return SORT_OPTIONS.some((option) => option.value === normalizedValue)
      ? normalizedValue
      : 'fechaCreacion,desc';
  }

  private parseNonNegativeInteger(value: string | null, fallback: number): number {
    if (!value) {
      return fallback;
    }

    const parsedValue = Number(value);

    return Number.isInteger(parsedValue) && parsedValue >= 0 ? parsedValue : fallback;
  }

  private parsePageSize(value: string | null): number {
    const parsedValue = this.parseNonNegativeInteger(value, 10);

    if (parsedValue < 1) {
      return 10;
    }

    return Math.min(parsedValue, 50);
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
