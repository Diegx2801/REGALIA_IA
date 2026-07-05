import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AdminStoreApiDto,
  AdminStoreReviewStatus,
  AdminStoreSearchFieldApi,
  AdminStoreSortApi,
} from '../../core/services/data-access/regalia/models/admin-store-api.model';
import { RegaliaAdminStoreApiService } from '../../core/services/data-access/regalia/services/regalia-admin-store-api.service';
import { PageApiDto } from '../../shared/models/api-response.model';

type AdminStoreFilter = 'TODAS' | AdminStoreReviewStatus;

interface AdminStoreStatusOption {
  value: AdminStoreFilter;
  label: string;
}

const STATUS_OPTIONS: AdminStoreStatusOption[] = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'APROBADA', label: 'Aprobadas' },
  { value: 'OBSERVADA', label: 'Observadas' },
  { value: 'RECHAZADA', label: 'Rechazadas' },
];

interface AdminStoreSearchFieldOption {
  value: AdminStoreSearchFieldApi;
  label: string;
  placeholder: string;
}

const SEARCH_FIELD_OPTIONS: AdminStoreSearchFieldOption[] = [
  { value: 'NOMBRE', label: 'Tienda', placeholder: 'Ej. Regalia Gifts' },
  { value: 'VENDEDOR', label: 'Vendedor', placeholder: 'Ej. Cliente Prueba' },
  { value: 'CORREO_VENDEDOR', label: 'Correo vendedor', placeholder: 'Ej. cliente@regalia.com' },
  { value: 'ID_TIENDA', label: 'ID tienda', placeholder: 'Ej. 3' },
];

interface AdminStoreSortOption {
  value: AdminStoreSortApi;
  label: string;
}

const SORT_OPTIONS: AdminStoreSortOption[] = [
  { value: 'idTienda,asc', label: 'ID menor' },
  { value: 'idTienda,desc', label: 'ID mayor' },
  { value: 'nombre,asc', label: 'Tienda A-Z' },
  { value: 'nombre,desc', label: 'Tienda Z-A' },
  { value: 'estadoRevision,asc', label: 'Estado' },
  { value: 'nombreVendedor,asc', label: 'Vendedor A-Z' },
  { value: 'fechaCreacion,desc', label: 'Mas recientes' },
];

@Component({
  selector: 'app-admin-stores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-stores.html',
  styleUrl: './admin-stores.css',
})
export class AdminStoresComponent implements OnInit {
  private readonly adminStoreApi = inject(RegaliaAdminStoreApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly statusOptions = STATUS_OPTIONS;
  readonly searchFieldOptions = SEARCH_FIELD_OPTIONS;
  readonly sortOptions = SORT_OPTIONS;
  readonly filter = signal<AdminStoreFilter>('TODAS');
  readonly searchField = signal<AdminStoreSearchFieldApi>('NOMBRE');
  readonly searchTerm = signal('');
  readonly page = signal(0);
  readonly pageSize = signal(10);
  readonly sort = signal<AdminStoreSortApi>('idTienda,asc');
  readonly pageInfo = signal<PageApiDto<AdminStoreApiDto> | null>(null);
  readonly stores = signal<AdminStoreApiDto[]>([]);
  readonly selectedStoreId = signal<number | null>(null);
  readonly isLoading = signal(false);
  readonly actionStoreId = signal<number | null>(null);
  readonly errorMessage = signal('');
  readonly actionMessage = signal('');

  readonly selectedStore = computed<AdminStoreApiDto | null>(() => {
    const selectedStoreId = this.selectedStoreId();
    return this.stores().find((store) => store.idTienda === selectedStoreId) ?? null;
  });
  readonly pendingCount = computed(
    () => this.stores().filter((store) => store.estadoRevision === 'PENDIENTE').length,
  );
  readonly approvedCount = computed(
    () => this.stores().filter((store) => store.estadoRevision === 'APROBADA').length,
  );
  readonly observedCount = computed(
    () => this.stores().filter((store) => store.estadoRevision === 'OBSERVADA').length,
  );
  readonly rejectedCount = computed(
    () => this.stores().filter((store) => store.estadoRevision === 'RECHAZADA').length,
  );
  readonly totalCount = computed(() => this.pageInfo()?.totalElementos ?? this.stores().length);
  readonly currentPage = computed(() => this.pageInfo()?.paginaActual ?? this.page());
  readonly totalPages = computed(() => this.pageInfo()?.totalPaginas ?? 0);
  readonly displayedCount = computed(() => this.stores().length);
  readonly isFirstPage = computed(() => this.currentPage() <= 0);
  readonly isLastPage = computed(() => this.pageInfo()?.ultimaPagina ?? true);
  readonly searchPlaceholder = computed(
    () =>
      this.searchFieldOptions.find((option) => option.value === this.searchField())?.placeholder ??
      'Buscar',
  );

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.filter.set(this.parseStatusFilter(params.get('estadoRevision')));
      this.searchField.set(this.parseSearchField(params.get('searchField')));
      this.searchTerm.set(params.get('search') ?? '');
      this.page.set(this.parseNonNegativeInteger(params.get('page'), 0));
      this.pageSize.set(this.parsePageSize(params.get('size')));
      this.sort.set(this.parseSort(params.get('sort')));
      this.selectedStoreId.set(null);
      this.actionMessage.set('');
      this.loadStores();
    });
  }

  setFilter(filter: AdminStoreFilter): void {
    this.updateQueryParams({
      estadoRevision: filter === 'TODAS' ? null : filter,
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

  selectStore(store: AdminStoreApiDto): void {
    this.selectedStoreId.set(store.idTienda);
    this.actionMessage.set('');
  }

  refresh(): void {
    this.loadStores();
  }

  changeStatus(store: AdminStoreApiDto, status: AdminStoreReviewStatus): void {
    if (this.actionStoreId()) return;

    const request = this.statusRequest(store.idTienda, status);
    this.actionStoreId.set(store.idTienda);
    this.actionMessage.set('');
    this.errorMessage.set('');

    request
      .pipe(
        finalize(() => this.actionStoreId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updatedStore) => {
          this.loadStores();
          this.actionMessage.set(`Tienda actualizada a ${this.statusLabel(updatedStore.estadoRevision)}.`);
        },
        error: () => {
          this.errorMessage.set('No se pudo actualizar el estado de la tienda. Intenta nuevamente.');
        },
      });
  }

  statusLabel(status: AdminStoreReviewStatus): string {
    const labels: Record<AdminStoreReviewStatus, string> = {
      PENDIENTE: 'Pendiente',
      APROBADA: 'Aprobada',
      OBSERVADA: 'Observada',
      RECHAZADA: 'Rechazada',
    };

    return labels[status];
  }

  statusTone(status: AdminStoreReviewStatus): string {
    const tones: Record<AdminStoreReviewStatus, string> = {
      PENDIENTE: 'warning',
      APROBADA: 'success',
      OBSERVADA: 'info',
      RECHAZADA: 'danger',
    };

    return tones[status];
  }

  sellerName(store: AdminStoreApiDto): string {
    return [store.nombreVendedor, store.apellidoVendedor].filter(Boolean).join(' ').trim() || 'Vendedor REGALIA';
  }

  rubrosText(store: AdminStoreApiDto): string {
    const rubros = store.rubros ?? [];
    if (rubros.length === 0) return 'Sin rubros asociados';
    return rubros.map((rubro) => rubro.nombre).join(', ');
  }

  trackStore(_: number, store: AdminStoreApiDto): number {
    return store.idTienda;
  }

  private loadStores(): void {
    const currentFilter = this.filter();
    const status = currentFilter === 'TODAS' ? undefined : currentFilter;
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminStoreApi
      .getStores({
        estadoRevision: status,
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
          this.stores.set(pageData.contenido);
          this.selectedStoreId.set(pageData.contenido[0]?.idTienda ?? null);
        },
        error: () => {
          this.pageInfo.set(null);
          this.stores.set([]);
          this.selectedStoreId.set(null);
          this.errorMessage.set('No se pudieron cargar las tiendas administrativas.');
        },
      });
  }

  private statusRequest(storeId: number, status: AdminStoreReviewStatus) {
    if (status === 'PENDIENTE') return this.adminStoreApi.markPending(storeId);
    if (status === 'APROBADA') return this.adminStoreApi.approve(storeId);
    if (status === 'OBSERVADA') return this.adminStoreApi.observe(storeId);
    return this.adminStoreApi.reject(storeId);
  }

  private parseStatusFilter(value: string | null): AdminStoreFilter {
    if (
      value === 'PENDIENTE' ||
      value === 'APROBADA' ||
      value === 'OBSERVADA' ||
      value === 'RECHAZADA'
    ) {
      return value;
    }

    return 'TODAS';
  }

  private parseSearchField(value: string | null): AdminStoreSearchFieldApi {
    if (value === 'VENDEDOR' || value === 'CORREO_VENDEDOR' || value === 'ID_TIENDA') {
      return value;
    }

    return 'NOMBRE';
  }

  private parseSort(value: string | null): AdminStoreSortApi {
    if (
      value === 'idTienda,desc' ||
      value === 'nombre,asc' ||
      value === 'nombre,desc' ||
      value === 'estadoRevision,asc' ||
      value === 'nombreVendedor,asc' ||
      value === 'fechaCreacion,desc'
    ) {
      return value;
    }

    return 'idTienda,asc';
  }

  private parseNonNegativeInteger(value: string | null, fallback: number): number {
    if (!value) {
      return fallback;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
  }

  private parsePageSize(value: string | null): number {
    const parsed = this.parseNonNegativeInteger(value, 10);
    return parsed >= 1 && parsed <= 50 ? parsed : 10;
  }

  private updateQueryParams(queryParams: Record<string, string | null>): void {
    void this.router.navigate([], {
      queryParams,
      queryParamsHandling: 'merge',
      relativeTo: this.route,
      replaceUrl: true,
    });
  }
}
