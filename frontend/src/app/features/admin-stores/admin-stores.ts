import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import {
  AdminStoreApiDto,
  AdminStoreReviewStatus,
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

@Component({
  selector: 'app-admin-stores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-stores.html',
  styleUrl: './admin-stores.css',
})
export class AdminStoresComponent implements OnInit {
  private readonly adminStoreApi = inject(RegaliaAdminStoreApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statusOptions = STATUS_OPTIONS;
  readonly filter = signal<AdminStoreFilter>('TODAS');
  readonly stores = signal<AdminStoreApiDto[]>([]);
  readonly selectedStoreId = signal<number | null>(null);
  readonly isLoading = signal(false);
  readonly actionStoreId = signal<number | null>(null);
  readonly errorMessage = signal('');
  readonly actionMessage = signal('');

  readonly selectedStore = computed(() => {
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

  ngOnInit(): void {
    this.loadStores();
  }

  setFilter(filter: AdminStoreFilter): void {
    this.filter.set(filter);
    this.selectedStoreId.set(null);
    this.actionMessage.set('');
    this.loadStores();
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
      .getStores(status)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (stores) => {
          this.stores.set(stores);
          const selectedStoreStillExists = stores.some(
            (store) => store.idTienda === this.selectedStoreId(),
          );
          if (!selectedStoreStillExists) {
            this.selectedStoreId.set(stores[0]?.idTienda ?? null);
          }
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
}
