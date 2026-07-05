import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AdminSellerApiDto,
  AdminSellerSearchFieldApi,
  AdminSellerSortApi,
  AdminSellerStatusFilterApi,
  AdminSellerVerificationFilterApi,
} from '../../core/services/data-access/regalia/models/admin-seller-api.model';
import { RegaliaAdminSellerApiService } from '../../core/services/data-access/regalia/services/regalia-admin-seller-api.service';
import { PageApiDto } from '../../shared/models/api-response.model';

type AdminSellerFilter = 'TODOS' | 'ACTIVOS' | 'INACTIVOS' | 'VERIFICADOS' | 'SIN_VERIFICAR';

interface AdminSellerFilterOption {
  value: AdminSellerFilter;
  label: string;
}

const FILTER_OPTIONS: AdminSellerFilterOption[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'ACTIVOS', label: 'Activos' },
  { value: 'INACTIVOS', label: 'Inactivos' },
  { value: 'VERIFICADOS', label: 'Verificados' },
  { value: 'SIN_VERIFICAR', label: 'Sin verificar' },
];

interface AdminSellerSearchFieldOption {
  value: AdminSellerSearchFieldApi;
  label: string;
  placeholder: string;
}

const SEARCH_FIELD_OPTIONS: AdminSellerSearchFieldOption[] = [
  { value: 'NOMBRE', label: 'Nombre', placeholder: 'Ej. Cliente Prueba' },
  { value: 'CORREO', label: 'Correo', placeholder: 'Ej. vendedor@regalia.com' },
  { value: 'ID_VENDEDOR', label: 'ID vendedor', placeholder: 'Ej. 1' },
  { value: 'ID_USUARIO', label: 'ID usuario', placeholder: 'Ej. 1' },
];

interface AdminSellerSortOption {
  value: AdminSellerSortApi;
  label: string;
}

const SORT_OPTIONS: AdminSellerSortOption[] = [
  { value: 'idVendedor,asc', label: 'ID menor' },
  { value: 'idVendedor,desc', label: 'ID mayor' },
  { value: 'idUsuario,asc', label: 'Usuario menor' },
  { value: 'nombre,asc', label: 'Nombre A-Z' },
  { value: 'nombre,desc', label: 'Nombre Z-A' },
  { value: 'correo,asc', label: 'Correo A-Z' },
  { value: 'fechaCreacion,desc', label: 'Mas recientes' },
];

@Component({
  selector: 'app-admin-sellers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-sellers.html',
  styleUrl: './admin-sellers.css',
})
export class AdminSellersComponent implements OnInit {
  private readonly adminSellerApi = inject(RegaliaAdminSellerApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly filterOptions = FILTER_OPTIONS;
  readonly searchFieldOptions = SEARCH_FIELD_OPTIONS;
  readonly sortOptions = SORT_OPTIONS;
  readonly filter = signal<AdminSellerFilter>('TODOS');
  readonly searchField = signal<AdminSellerSearchFieldApi>('NOMBRE');
  readonly searchTerm = signal('');
  readonly page = signal(0);
  readonly pageSize = signal(10);
  readonly sort = signal<AdminSellerSortApi>('idVendedor,asc');
  readonly pageInfo = signal<PageApiDto<AdminSellerApiDto> | null>(null);
  readonly sellers = signal<AdminSellerApiDto[]>([]);
  readonly selectedSellerId = signal<number | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  readonly selectedSeller = computed<AdminSellerApiDto | null>(() => {
    const selectedSellerId = this.selectedSellerId();

    return (
      this.sellers().find((seller) => seller.idVendedor === selectedSellerId) ??
      this.sellers()[0] ??
      null
    );
  });

  readonly totalCount = computed(() => this.pageInfo()?.totalElementos ?? this.sellers().length);
  readonly activeCount = computed(
    () => this.sellers().filter((seller) => Boolean(seller.estado)).length,
  );
  readonly verifiedCount = computed(
    () => this.sellers().filter((seller) => Boolean(seller.vendedorVerificado)).length,
  );
  readonly withStoresCount = computed(
    () => this.sellers().filter((seller) => (seller.cantidadTiendasTotales ?? 0) > 0).length,
  );
  readonly searchPlaceholder = computed(
    () =>
      this.searchFieldOptions.find((option) => option.value === this.searchField())?.placeholder ??
      'Buscar',
  );

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.filter.set(this.parseFilter(params.get('estado'), params.get('verificacion')));
      this.searchField.set(this.parseSearchField(params.get('searchField')));
      this.searchTerm.set(params.get('search') ?? '');
      this.page.set(this.parseNonNegativeInteger(params.get('page'), 0));
      this.pageSize.set(this.parsePageSize(params.get('size')));
      this.sort.set(this.parseSort(params.get('sort')));
      this.selectedSellerId.set(null);
      this.loadSellers();
    });
  }

  setFilter(filter: AdminSellerFilter): void {
    const query = this.queryFromFilter(filter);
    this.updateQueryParams({
      estado: query.estado ?? null,
      verificacion: query.verificacion ?? null,
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

  selectSeller(seller: AdminSellerApiDto): void {
    this.selectedSellerId.set(seller.idVendedor);
  }

  isSelectedSeller(seller: AdminSellerApiDto): boolean {
    return this.selectedSeller()?.idVendedor === seller.idVendedor;
  }

  refresh(): void {
    this.loadSellers();
  }

  sellerName(seller: AdminSellerApiDto): string {
    return (
      [seller.nombreUsuario, seller.apellidoUsuario].filter(Boolean).join(' ').trim() ||
      'Vendedor REGALIA'
    );
  }

  statusLabel(seller: AdminSellerApiDto): string {
    return seller.estado ? 'Activo' : 'Inactivo';
  }

  verificationLabel(seller: AdminSellerApiDto): string {
    return seller.vendedorVerificado ? 'Verificado' : 'Sin verificar';
  }

  formatDate(value: string | null): string {
    if (!value) return 'No registrada';

    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  trackSeller(_: number, seller: AdminSellerApiDto): number {
    return seller.idVendedor;
  }

  readonly currentPage = computed(() => this.pageInfo()?.paginaActual ?? this.page());
  readonly totalPages = computed(() => this.pageInfo()?.totalPaginas ?? 0);
  readonly displayedCount = computed(() => this.sellers().length);
  readonly isFirstPage = computed(() => this.currentPage() <= 0);
  readonly isLastPage = computed(() => this.pageInfo()?.ultimaPagina ?? true);

  private loadSellers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminSellerApi
      .getSellers({
        ...this.queryFromFilter(this.filter()),
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
          this.sellers.set(pageData.contenido);
          this.selectedSellerId.set(pageData.contenido[0]?.idVendedor ?? null);
        },
        error: () => {
          this.pageInfo.set(null);
          this.sellers.set([]);
          this.selectedSellerId.set(null);
          this.errorMessage.set('No se pudieron cargar los vendedores administrativos.');
        },
      });
  }

  private parseFilter(
    estado: string | null,
    verificacion: string | null,
  ): AdminSellerFilter {
    if (estado === 'ACTIVO') return 'ACTIVOS';
    if (estado === 'INACTIVO') return 'INACTIVOS';
    if (verificacion === 'VERIFICADO') return 'VERIFICADOS';
    if (verificacion === 'SIN_VERIFICAR') return 'SIN_VERIFICAR';
    return 'TODOS';
  }

  private parseSearchField(value: string | null): AdminSellerSearchFieldApi {
    if (value === 'CORREO' || value === 'ID_VENDEDOR' || value === 'ID_USUARIO') {
      return value;
    }

    return 'NOMBRE';
  }

  private parseSort(value: string | null): AdminSellerSortApi {
    if (
      value === 'idVendedor,desc' ||
      value === 'idUsuario,asc' ||
      value === 'nombre,asc' ||
      value === 'nombre,desc' ||
      value === 'correo,asc' ||
      value === 'fechaCreacion,desc'
    ) {
      return value;
    }

    return 'idVendedor,asc';
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

  private queryFromFilter(filter: AdminSellerFilter): {
    estado?: AdminSellerStatusFilterApi;
    verificacion?: AdminSellerVerificationFilterApi;
  } {
    if (filter === 'ACTIVOS') return { estado: 'ACTIVO' };
    if (filter === 'INACTIVOS') return { estado: 'INACTIVO' };
    if (filter === 'VERIFICADOS') return { verificacion: 'VERIFICADO' };
    if (filter === 'SIN_VERIFICAR') return { verificacion: 'SIN_VERIFICAR' };
    return {};
  }

  private updateQueryParams(queryParams: Record<string, string | null | undefined>): void {
    void this.router.navigate([], {
      queryParams,
      queryParamsHandling: 'merge',
      relativeTo: this.route,
      replaceUrl: true,
    });
  }
}
