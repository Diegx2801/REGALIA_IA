import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import {
  AdminCatalogGroup,
  AdminCatalogItem,
  AdminCatalogType,
} from '../../core/services/data-access/regalia/models/admin-catalog-api.model';
import { RegaliaAdminCatalogApiService } from '../../core/services/data-access/regalia/services/regalia-admin-catalog-api.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

interface AdminCatalogDetailRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-admin-catalogs',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './admin-catalogs.html',
  styleUrl: './admin-catalogs.css',
})
export class AdminCatalogsComponent implements OnInit {
  private readonly adminCatalogApi = inject(RegaliaAdminCatalogApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly groups = signal<AdminCatalogGroup[]>([]);
  readonly selectedType = signal<AdminCatalogType>('RUBROS');
  readonly selectedItemId = signal<number | null>(null);
  readonly searchTerm = signal('');
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  readonly selectedGroup = computed<AdminCatalogGroup | null>(
    () => this.groups().find((group) => group.type === this.selectedType()) ?? null,
  );

  readonly filteredItems = computed(() => {
    const group = this.selectedGroup();
    const normalizedSearch = this.normalize(this.searchTerm());

    if (!group) return [];

    return group.items.filter((item) => {
      if (!normalizedSearch) return true;

      return this.normalize(
        [
          item.id,
          item.name,
          item.description,
          item.primaryMeta,
          item.secondaryMeta,
          this.statusLabel(item),
        ].join(' '),
      ).includes(normalizedSearch);
    });
  });

  readonly selectedItem = computed<AdminCatalogItem | null>(() => {
    const selectedItemId = this.selectedItemId();
    const filteredItems = this.filteredItems();

    return filteredItems.find((item) => item.id === selectedItemId) ?? filteredItems[0] ?? null;
  });

  readonly totalItemsCount = computed(() =>
    this.groups().reduce((total, group) => total + group.items.length, 0),
  );

  readonly activeItemsCount = computed(() =>
    this.groups().reduce(
      (total, group) => total + group.items.filter((item) => item.estado).length,
      0,
    ),
  );

  readonly inactiveItemsCount = computed(() =>
    this.groups().reduce(
      (total, group) => total + group.items.filter((item) => item.estado === false).length,
      0,
    ),
  );

  readonly detailRows = computed<AdminCatalogDetailRow[]>(() => {
    const item = this.selectedItem();

    if (!item) return [];

    return [
      { label: 'Estado', value: this.statusLabel(item) },
      { label: 'Referencia', value: item.primaryMeta },
      { label: 'Contexto', value: item.secondaryMeta },
      { label: 'ID interno', value: `#${item.id}` },
      { label: 'Creacion', value: this.formatDate(item.fechaCreacion) },
      { label: 'Ultima actualizacion', value: this.formatDate(item.fechaActualizacion) },
    ];
  });

  ngOnInit(): void {
    this.loadCatalogs();
  }

  selectGroup(group: AdminCatalogGroup): void {
    this.selectedType.set(group.type);
    this.selectedItemId.set(null);
    this.searchTerm.set('');
  }

  selectItem(item: AdminCatalogItem): void {
    this.selectedItemId.set(item.id);
  }

  isSelectedItem(item: AdminCatalogItem): boolean {
    const selectedItem = this.selectedItem();
    return selectedItem !== null && selectedItem.id === item.id;
  }

  refresh(): void {
    this.loadCatalogs();
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.selectedItemId.set(null);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.selectedItemId.set(null);
  }

  statusLabel(item: AdminCatalogItem): string {
    if (item.estado === true) return 'Activo';
    if (item.estado === false) return 'Inactivo';
    return 'Sin estado';
  }

  statusTone(item: AdminCatalogItem): 'success' | 'danger' | 'neutral' {
    if (item.estado === true) return 'success';
    if (item.estado === false) return 'danger';
    return 'neutral';
  }

  formatDate(value: string | null): string {
    if (!value) return 'No registrada';

    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  trackGroup(_: number, group: AdminCatalogGroup): AdminCatalogType {
    return group.type;
  }

  trackItem(_: number, item: AdminCatalogItem): string {
    return `${item.type}-${item.id}`;
  }

  private loadCatalogs(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminCatalogApi
      .getCatalogs()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (groups) => {
          this.groups.set(groups);

          const currentTypeExists = groups.some((group) => group.type === this.selectedType());
          if (!currentTypeExists) {
            this.selectedType.set(groups[0]?.type ?? 'RUBROS');
          }

          const selectedItemStillExists = this.filteredItems().some(
            (item) => item.id === this.selectedItemId(),
          );
          if (!selectedItemStillExists) {
            this.selectedItemId.set(this.filteredItems()[0]?.id ?? null);
          }
        },
        error: () => {
          this.groups.set([]);
          this.selectedItemId.set(null);
          this.errorMessage.set('No se pudieron cargar los catalogos administrativos.');
        },
      });
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
