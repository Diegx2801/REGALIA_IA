import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminSellerApiDto } from '../../core/services/data-access/regalia/models/admin-seller-api.model';
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

@Component({
  selector: 'app-admin-sellers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-sellers.html',
  styleUrl: './admin-sellers.css',
})
export class AdminSellersComponent implements OnInit {
  private readonly adminSellerApi = inject(RegaliaAdminSellerApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly filterOptions = FILTER_OPTIONS;
  readonly filter = signal<AdminSellerFilter>('TODOS');
  readonly searchTerm = signal('');
  readonly sellers = signal<AdminSellerApiDto[]>([]);
  readonly selectedSellerId = signal<number | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  readonly filteredSellers = computed(() => {
    const normalizedSearch = this.normalize(this.searchTerm());
    const currentFilter = this.filter();

    return this.sellers().filter((seller) => {
      const matchesFilter = this.matchesFilter(seller, currentFilter);
      const matchesSearch =
        normalizedSearch.length === 0 ||
        this.normalize(
          [
            seller.nombreUsuario,
            seller.apellidoUsuario,
            seller.correoUsuario,
            seller.idVendedor,
            seller.idUsuario,
          ].join(' '),
        ).includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  });

  readonly selectedSeller = computed(() => {
    const filteredSellers = this.filteredSellers();
    const selectedSellerId = this.selectedSellerId();

    return (
      filteredSellers.find((seller) => seller.idVendedor === selectedSellerId) ??
      filteredSellers[0] ??
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

  ngOnInit(): void {
    this.loadSellers();
  }

  setFilter(filter: AdminSellerFilter): void {
    this.filter.set(filter);
    this.selectedSellerId.set(null);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.selectedSellerId.set(null);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.selectedSellerId.set(null);
  }

  selectSeller(seller: AdminSellerApiDto): void {
    this.selectedSellerId.set(seller.idVendedor);
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
      .getSellers()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (sellers) => {
          this.sellers.set(sellers);
          const selectedSellerStillExists = sellers.some(
            (seller) => seller.idVendedor === this.selectedSellerId(),
          );
          if (!selectedSellerStillExists) {
            this.selectedSellerId.set(sellers[0]?.idVendedor ?? null);
          }
        },
        error: () => {
          this.sellers.set([]);
          this.selectedSellerId.set(null);
          this.errorMessage.set('No se pudieron cargar los vendedores administrativos.');
        },
      });
  }

  private matchesFilter(seller: AdminSellerApiDto, filter: AdminSellerFilter): boolean {
    if (filter === 'ACTIVOS') return Boolean(seller.estado);
    if (filter === 'INACTIVOS') return !seller.estado;
    if (filter === 'VERIFICADOS') return Boolean(seller.vendedorVerificado);
    if (filter === 'SIN_VERIFICAR') return !seller.vendedorVerificado;
    return true;
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
