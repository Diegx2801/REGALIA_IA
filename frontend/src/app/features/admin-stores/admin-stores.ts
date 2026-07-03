import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AdminStoreApiDto,
  AdminStoreReviewStatus,
  AdminStoreSearchFieldApi,
} from '../../core/services/data-access/regalia/models/admin-store-api.model';
import { RegaliaAdminStoreApiService } from '../../core/services/data-access/regalia/services/regalia-admin-store-api.service';

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
  readonly filter = signal<AdminStoreFilter>('TODAS');
  readonly searchField = signal<AdminStoreSearchFieldApi>('NOMBRE');
  readonly searchTerm = signal('');
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
      this.selectedStoreId.set(null);
      this.actionMessage.set('');
      this.loadStores();
    });
  }

  setFilter(filter: AdminStoreFilter): void {
    this.updateQueryParams({ estadoRevision: filter === 'TODAS' ? null : filter });
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
          this.replaceStore(updatedStore);
          const currentFilter = this.filter();
          const shouldRemainVisible =
            currentFilter === 'TODAS' || updatedStore.estadoRevision === currentFilter;
          this.selectedStoreId.set(
            shouldRemainVisible ? updatedStore.idTienda : (this.stores()[0]?.idTienda ?? null),
          );
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
      })
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (stores) => {
          this.stores.set(stores);
          this.selectedStoreId.set(stores[0]?.idTienda ?? null);
        },
        error: () => {
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

  private replaceStore(updatedStore: AdminStoreApiDto): void {
    const currentFilter = this.filter();
    this.stores.update((stores) => {
      if (currentFilter !== 'TODAS' && updatedStore.estadoRevision !== currentFilter) {
        return stores.filter((store) => store.idTienda !== updatedStore.idTienda);
      }

      return stores.map((store) => (store.idTienda === updatedStore.idTienda ? updatedStore : store));
    });
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

  private updateQueryParams(queryParams: Record<string, string | null>): void {
    void this.router.navigate([], {
      queryParams,
      queryParamsHandling: 'merge',
      relativeTo: this.route,
      replaceUrl: true,
    });
  }
}
