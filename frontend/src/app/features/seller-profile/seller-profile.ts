import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import {
  SellerProductApiDto,
  SellerProfileApiDto,
  SellerStoreApiDto,
  SellerStoreRubroApiDto,
} from '../../core/services/data-access/regalia/models/seller-workspace-api.model';
import { RegaliaSellerWorkspaceApiService } from '../../core/services/data-access/regalia/services/regalia-seller-workspace-api.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-seller-profile',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './seller-profile.html',
  styleUrl: './seller-profile.css',
})
export class SellerProfileComponent {
  private readonly sellerApi = inject(RegaliaSellerWorkspaceApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly profile = signal<SellerProfileApiDto | null>(null);
  readonly stores = signal<SellerStoreApiDto[]>([]);
  readonly selectedStore = signal<SellerStoreApiDto | null>(null);
  readonly products = signal<SellerProductApiDto[]>([]);
  readonly isLoadingWorkspace = signal(false);
  readonly isLoadingProducts = signal(false);
  readonly errorMessage = signal('');
  readonly productErrorMessage = signal('');

  readonly metrics = computed(() => {
    const stores = this.stores();
    const products = this.products();
    const approvedStores = stores.filter((store) => store.estadoRevision === 'APROBADA').length;
    const visibleProducts = products.filter((product) => product.visibleEnTienda !== false).length;

    return [
      { label: 'Tiendas', value: String(stores.length), hint: `${approvedStores} aprobadas` },
      { label: 'Productos', value: String(products.length), hint: `${visibleProducts} visibles` },
      { label: 'Stock total', value: String(this.totalStock(products)), hint: 'Unidades publicadas' },
      {
        label: 'Perfil',
        value: this.profile()?.vendedorVerificado ? 'Verificado' : 'Pendiente',
        hint: this.profile()?.estado === false ? 'Cuenta inactiva' : 'Cuenta activa',
      },
    ];
  });

  ngOnInit(): void {
    this.loadWorkspace();
  }

  loadWorkspace(): void {
    this.errorMessage.set('');
    this.productErrorMessage.set('');
    this.isLoadingWorkspace.set(true);

    forkJoin({
      profile: this.sellerApi.getProfile(),
      stores: this.sellerApi.getStores(),
    })
      .pipe(
        finalize(() => this.isLoadingWorkspace.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ profile, stores }) => {
          this.profile.set(profile);
          this.stores.set(stores);
          const nextStore = stores[0] ?? null;
          this.selectedStore.set(nextStore);

          if (nextStore) {
            this.loadProducts(nextStore.idTienda);
          } else {
            this.products.set([]);
          }
        },
        error: () => {
          this.profile.set(null);
          this.stores.set([]);
          this.selectedStore.set(null);
          this.products.set([]);
          this.errorMessage.set('No se pudo cargar tu espacio vendedor.');
        },
      });
  }

  createProfile(): void {
    this.errorMessage.set('');
    this.isLoadingWorkspace.set(true);

    this.sellerApi
      .createProfile()
      .pipe(
        finalize(() => this.isLoadingWorkspace.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.loadWorkspace(),
        error: () => this.errorMessage.set('No se pudo activar el perfil vendedor.'),
      });
  }

  selectStore(store: SellerStoreApiDto): void {
    this.selectedStore.set(store);
    this.loadProducts(store.idTienda);
  }

  formatAmount(value: number | null | undefined): string {
    return Number(value ?? 0).toFixed(2);
  }

  sellerName(profile: SellerProfileApiDto | null): string {
    const fullName = [profile?.nombreUsuario, profile?.apellidoUsuario]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fullName || profile?.correoUsuario || 'Vendedor REGALIA';
  }

  rubrosLabel(store: SellerStoreApiDto | null): string {
    const rubros = store?.rubros ?? [];
    return rubros.length > 0 ? rubros.map((rubro) => rubro.nombre).join(', ') : 'Sin rubros asignados';
  }

  storeRubros(store: SellerStoreApiDto): SellerStoreRubroApiDto[] {
    return store.rubros ?? [];
  }

  isSelectedStore(store: SellerStoreApiDto): boolean {
    const selectedStore = this.selectedStore();
    return selectedStore !== null && selectedStore.idTienda === store.idTienda;
  }

  selectedStoreName(): string {
    return this.selectedStore()?.nombre || 'Catalogo de tienda';
  }

  storeReviewLabel(status: string | null | undefined): string {
    const labels: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      APROBADA: 'Aprobada',
      OBSERVADA: 'Observada',
      RECHAZADA: 'Rechazada',
    };

    return labels[status ?? ''] ?? 'Sin revision';
  }

  trackMetric(_: number, metric: { label: string }): string {
    return metric.label;
  }

  trackStore(_: number, store: SellerStoreApiDto): number {
    return store.idTienda;
  }

  trackProduct(_: number, product: SellerProductApiDto): number {
    return product.idProducto;
  }

  trackRubro(_: number, rubro: SellerStoreRubroApiDto): number {
    return rubro.idRubro;
  }

  private loadProducts(storeId: number): void {
    this.productErrorMessage.set('');
    this.isLoadingProducts.set(true);

    this.sellerApi
      .getProductsByStore(storeId)
      .pipe(
        finalize(() => this.isLoadingProducts.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (products) => this.products.set(products),
        error: () => {
          this.products.set([]);
          this.productErrorMessage.set('No se pudieron cargar los productos de la tienda.');
        },
      });
  }

  private totalStock(products: SellerProductApiDto[]): number {
    return products.reduce((total, product) => total + Number(product.stock ?? 0), 0);
  }
}
