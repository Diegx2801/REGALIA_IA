import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import {
  SellerProductApiDto,
  SellerProductImageUpsertRequest,
  SellerProductUpsertRequest,
  SellerProfileApiDto,
  SellerStoreApiDto,
  SellerStoreRubroApiDto,
  SellerStoreUpdateRequest,
} from '../../core/services/data-access/regalia/models/seller-workspace-api.model';
import { RegaliaSellerWorkspaceApiService } from '../../core/services/data-access/regalia/services/regalia-seller-workspace-api.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

interface StoreFormState {
  nombre: string;
  descripcion: string;
  direccionReferencia: string;
}

interface ProductFormState {
  idTipoProducto: number | null;
  nombre: string;
  descripcion: string;
  precio: number | null;
  stock: number | null;
  visibleEnTienda: boolean;
}

@Component({
  selector: 'app-seller-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent],
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
  readonly actionMessage = signal('');
  readonly actionErrorMessage = signal('');
  readonly isEditingStore = signal(false);
  readonly isSavingStore = signal(false);
  readonly isProductFormOpen = signal(false);
  readonly isSavingProduct = signal(false);
  readonly editingProduct = signal<SellerProductApiDto | null>(null);

  storeForm: StoreFormState = this.emptyStoreForm();
  productForm: ProductFormState = this.emptyProductForm();

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
    this.clearActionMessages();
    this.closeStoreForm();
    this.closeProductForm();
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
    this.clearActionMessages();
    this.closeStoreForm();
    this.closeProductForm();
    this.loadProducts(store.idTienda);
  }

  openStoreForm(store: SellerStoreApiDto | null = this.selectedStore()): void {
    if (!store) {
      return;
    }

    this.clearActionMessages();
    this.storeForm = {
      nombre: store.nombre ?? '',
      descripcion: store.descripcion ?? '',
      direccionReferencia: store.direccionReferencia ?? '',
    };
    this.isEditingStore.set(true);
  }

  closeStoreForm(): void {
    this.storeForm = this.emptyStoreForm();
    this.isEditingStore.set(false);
  }

  saveStore(): void {
    const store = this.selectedStore();
    const nombre = this.storeForm.nombre.trim();

    if (!store || !nombre) {
      this.actionErrorMessage.set('El nombre de la tienda es obligatorio.');
      return;
    }

    const request: SellerStoreUpdateRequest = {
      nombre,
      descripcion: this.normalizeOptionalText(this.storeForm.descripcion),
      direccionReferencia: this.normalizeOptionalText(this.storeForm.direccionReferencia),
      idDocumentoFiscal: store.idDocumentoFiscal ?? null,
      idsRubros: (store.rubros ?? []).map((rubro) => rubro.idRubro),
    };

    this.clearActionMessages();
    this.isSavingStore.set(true);

    this.sellerApi
      .updateStore(store.idTienda, request)
      .pipe(
        finalize(() => this.isSavingStore.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updatedStore) => {
          this.syncUpdatedStore(updatedStore);
          this.closeStoreForm();
          this.actionMessage.set('Tienda actualizada correctamente.');
        },
        error: () => this.actionErrorMessage.set('No se pudo actualizar la tienda.'),
      });
  }

  openCreateProductForm(): void {
    if (!this.selectedStore()) {
      this.actionErrorMessage.set('Selecciona una tienda antes de agregar productos.');
      return;
    }

    this.clearActionMessages();
    this.editingProduct.set(null);
    this.productForm = this.emptyProductForm();
    this.isProductFormOpen.set(true);
  }

  openEditProductForm(product: SellerProductApiDto): void {
    this.clearActionMessages();
    this.editingProduct.set(product);
    this.productForm = {
      idTipoProducto: product.idTipoProducto,
      nombre: product.nombre ?? '',
      descripcion: product.descripcion ?? '',
      precio: product.precio,
      stock: product.stock,
      visibleEnTienda: product.visibleEnTienda !== false,
    };
    this.isProductFormOpen.set(true);
  }

  closeProductForm(): void {
    this.productForm = this.emptyProductForm();
    this.editingProduct.set(null);
    this.isProductFormOpen.set(false);
  }

  saveProduct(): void {
    const store = this.selectedStore();
    const editingProduct = this.editingProduct();
    const nombre = this.productForm.nombre.trim();

    if (
      !nombre ||
      this.productForm.idTipoProducto === null ||
      this.productForm.precio === null ||
      this.productForm.stock === null
    ) {
      this.actionErrorMessage.set('Completa nombre, tipo, precio y stock con valores validos.');
      return;
    }

    const idTipoProducto = Number(this.productForm.idTipoProducto);
    const precio = Number(this.productForm.precio);
    const stock = Number(this.productForm.stock);

    if (!store) {
      this.actionErrorMessage.set('Selecciona una tienda antes de guardar productos.');
      return;
    }

    if (!Number.isInteger(idTipoProducto) || idTipoProducto <= 0 || precio <= 0 || stock < 0) {
      this.actionErrorMessage.set('Completa nombre, tipo, precio y stock con valores validos.');
      return;
    }

    const request: SellerProductUpsertRequest = {
      idTipoProducto,
      nombre,
      descripcion: this.normalizeOptionalText(this.productForm.descripcion),
      precio,
      stock,
      visibleEnTienda: this.productForm.visibleEnTienda,
      imagenes: this.buildProductImages(editingProduct),
    };

    this.clearActionMessages();
    this.isSavingProduct.set(true);

    const operation = editingProduct
      ? this.sellerApi.updateProduct(store.idTienda, editingProduct.idProducto, request)
      : this.sellerApi.createProduct(store.idTienda, request);

    operation
      .pipe(
        finalize(() => this.isSavingProduct.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (savedProduct) => {
          const nextProducts = editingProduct
            ? this.products().map((product) =>
                product.idProducto === savedProduct.idProducto ? savedProduct : product,
              )
            : [...this.products(), savedProduct];

          this.products.set(this.sortProducts(nextProducts));
          this.closeProductForm();
          this.actionMessage.set(
            editingProduct ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.',
          );
        },
        error: () => this.actionErrorMessage.set('No se pudo guardar el producto.'),
      });
  }

  deactivateProduct(product: SellerProductApiDto): void {
    const store = this.selectedStore();

    if (!store) {
      return;
    }

    const confirmed = window.confirm(`Desactivar "${product.nombre ?? 'este producto'}"?`);

    if (!confirmed) {
      return;
    }

    this.clearActionMessages();

    this.sellerApi
      .deactivateProduct(store.idTienda, product.idProducto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.products.set(
            this.products().filter((currentProduct) => currentProduct.idProducto !== product.idProducto),
          );

          if (this.editingProduct()?.idProducto === product.idProducto) {
            this.closeProductForm();
          }

          this.actionMessage.set('Producto desactivado correctamente.');
        },
        error: () => this.actionErrorMessage.set('No se pudo desactivar el producto.'),
      });
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

  private emptyStoreForm(): StoreFormState {
    return {
      nombre: '',
      descripcion: '',
      direccionReferencia: '',
    };
  }

  private emptyProductForm(): ProductFormState {
    return {
      idTipoProducto: null,
      nombre: '',
      descripcion: '',
      precio: null,
      stock: null,
      visibleEnTienda: true,
    };
  }

  private normalizeOptionalText(value: string): string | null {
    const normalizedValue = value.trim();
    return normalizedValue.length > 0 ? normalizedValue : null;
  }

  private syncUpdatedStore(updatedStore: SellerStoreApiDto): void {
    this.stores.set(
      this.stores().map((store) =>
        store.idTienda === updatedStore.idTienda ? updatedStore : store,
      ),
    );
    this.selectedStore.set(updatedStore);
  }

  private buildProductImages(product: SellerProductApiDto | null): SellerProductImageUpsertRequest[] {
    return (product?.imagenes ?? [])
      .map((image, index) => ({
        urlImagen: image.urlImagen?.trim() ?? '',
        orden: image.orden ?? index + 1,
      }))
      .filter((image) => image.urlImagen.length > 0);
  }

  private sortProducts(products: SellerProductApiDto[]): SellerProductApiDto[] {
    return [...products].sort((firstProduct, secondProduct) => firstProduct.idProducto - secondProduct.idProducto);
  }

  private clearActionMessages(): void {
    this.actionMessage.set('');
    this.actionErrorMessage.set('');
  }
}
