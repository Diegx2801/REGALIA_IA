import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AdminSellerApiDto,
  AdminSellerSearchFieldApi,
  AdminSellerStatusFilterApi,
  AdminSellerVerificationFilterApi,
} from '../../core/services/data-access/regalia/models/admin-seller-api.model';
import { RegaliaAdminSellerApiService } from '../../core/services/data-access/regalia/services/regalia-admin-seller-api.service';

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
  readonly filter = signal<AdminSellerFilter>('TODOS');
  readonly searchField = signal<AdminSellerSearchFieldApi>('NOMBRE');
  readonly searchTerm = signal('');
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

  readonly totalCount = computed(() => this.sellers().length);
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
      this.selectedSellerId.set(null);
      this.loadSellers();
    });
  }

  setFilter(filter: AdminSellerFilter): void {
    const query = this.queryFromFilter(filter);
    this.updateQueryParams({
      estado: query.estado ?? null,
      verificacion: query.verificacion ?? null,
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

  private loadSellers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminSellerApi
      .getSellers({
        ...this.queryFromFilter(this.filter()),
        searchField: this.searchField(),
        search: this.searchTerm(),
      })
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (sellers) => {
          this.sellers.set(sellers);
          this.selectedSellerId.set(sellers[0]?.idVendedor ?? null);
        },
        error: () => {
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
