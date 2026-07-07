import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AdminUserApiDto,
  AdminUserSearchFieldApi,
  AdminUserSortApi,
  AdminUserStatusFilterApi,
} from '../../core/services/data-access/regalia/models/admin-user-api.model';
import { RegaliaAdminUserApiService } from '../../core/services/data-access/regalia/services/regalia-admin-user-api.service';
import { PageApiDto } from '../../shared/models/api-response.model';

interface AdminUserFilterOption {
  value: AdminUserStatusFilterApi;
  label: string;
}

const FILTER_OPTIONS: AdminUserFilterOption[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'ACTIVO', label: 'Activos' },
  { value: 'INACTIVO', label: 'Inactivos' },
];

interface AdminUserSearchFieldOption {
  value: AdminUserSearchFieldApi;
  label: string;
  placeholder: string;
}

const SEARCH_FIELD_OPTIONS: AdminUserSearchFieldOption[] = [
  { value: 'NOMBRE', label: 'Nombre', placeholder: 'Ej. Cliente Prueba' },
  { value: 'CORREO', label: 'Correo', placeholder: 'Ej. cliente@regalia.com' },
  { value: 'TELEFONO', label: 'Telefono', placeholder: 'Ej. 999111222' },
  { value: 'ID_USUARIO', label: 'ID usuario', placeholder: 'Ej. 1' },
];

interface AdminUserSortOption {
  value: AdminUserSortApi;
  label: string;
}

const SORT_OPTIONS: AdminUserSortOption[] = [
  { value: 'idUsuario,asc', label: 'ID menor' },
  { value: 'idUsuario,desc', label: 'ID mayor' },
  { value: 'nombre,asc', label: 'Nombre A-Z' },
  { value: 'nombre,desc', label: 'Nombre Z-A' },
  { value: 'correo,asc', label: 'Correo A-Z' },
  { value: 'fechaCreacion,desc', label: 'Mas recientes' },
];

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsersComponent implements OnInit {
  private readonly adminUserApi = inject(RegaliaAdminUserApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly filterOptions = FILTER_OPTIONS;
  readonly searchFieldOptions = SEARCH_FIELD_OPTIONS;
  readonly sortOptions = SORT_OPTIONS;
  readonly filter = signal<AdminUserStatusFilterApi>('TODOS');
  readonly searchField = signal<AdminUserSearchFieldApi>('NOMBRE');
  readonly searchTerm = signal('');
  readonly page = signal(0);
  readonly pageSize = signal(10);
  readonly sort = signal<AdminUserSortApi>('idUsuario,asc');
  readonly pageInfo = signal<PageApiDto<AdminUserApiDto> | null>(null);
  readonly users = signal<AdminUserApiDto[]>([]);
  readonly selectedUserId = signal<number | null>(null);
  readonly pendingStatusChangeId = signal<number | null>(null);
  readonly actionUserId = signal<number | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly actionMessage = signal('');

  readonly selectedUser = computed<AdminUserApiDto | null>(() => {
    const selectedUserId = this.selectedUserId();

    return (
      this.users().find((user) => user.idUsuario === selectedUserId) ??
      this.users()[0] ??
      null
    );
  });

  readonly totalCount = computed(() => this.pageInfo()?.totalElementos ?? this.users().length);
  readonly activeCount = computed(() => this.users().filter((user) => Boolean(user.estado)).length);
  readonly inactiveCount = computed(() => this.users().filter((user) => !user.estado).length);
  readonly withPhoneCount = computed(
    () => this.users().filter((user) => Boolean(user.telefono?.trim())).length,
  );
  readonly searchPlaceholder = computed(
    () =>
      this.searchFieldOptions.find((option) => option.value === this.searchField())?.placeholder ??
      'Buscar',
  );

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.filter.set(this.parseStatusFilter(params.get('estado')));
      this.searchField.set(this.parseSearchField(params.get('searchField')));
      this.searchTerm.set(params.get('search') ?? '');
      this.page.set(this.parseNonNegativeInteger(params.get('page'), 0));
      this.pageSize.set(this.parsePageSize(params.get('size')));
      this.sort.set(this.parseSort(params.get('sort')));
      this.selectedUserId.set(null);
      this.pendingStatusChangeId.set(null);
      this.loadUsers();
    });
  }

  setFilter(filter: AdminUserStatusFilterApi): void {
    this.updateQueryParams({
      estado: filter === 'TODOS' ? null : filter,
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

  selectUser(user: AdminUserApiDto): void {
    this.selectedUserId.set(user.idUsuario);
    this.pendingStatusChangeId.set(null);
    this.actionMessage.set('');
  }

  refresh(): void {
    this.loadUsers();
  }

  requestStatusChange(user: AdminUserApiDto): void {
    this.pendingStatusChangeId.set(user.idUsuario);
    this.actionMessage.set('');
    this.errorMessage.set('');
  }

  cancelStatusChange(): void {
    this.pendingStatusChangeId.set(null);
  }

  confirmStatusChange(user: AdminUserApiDto): void {
    if (this.actionUserId() !== null) return;

    if (user.estado) {
      this.deactivateUser(user);
      return;
    }

    this.reactivateUser(user);
  }

  isSelectedUser(user: AdminUserApiDto): boolean {
    const selectedUser = this.selectedUser();
    return selectedUser !== null && selectedUser.idUsuario === user.idUsuario;
  }

  isPendingStatusChange(user: AdminUserApiDto): boolean {
    return this.pendingStatusChangeId() === user.idUsuario;
  }

  userName(user: AdminUserApiDto): string {
    return [user.nombres, user.apellidos].filter(Boolean).join(' ').trim() || 'Usuario REGALIA';
  }

  statusLabel(user: AdminUserApiDto): string {
    return user.estado ? 'Activo' : 'Inactivo';
  }

  statusTone(user: AdminUserApiDto): 'success' | 'danger' {
    return user.estado ? 'success' : 'danger';
  }

  hasPhone(user: AdminUserApiDto): boolean {
    return Boolean(user.telefono?.trim());
  }

  statusActionLabel(user: AdminUserApiDto): string {
    return user.estado ? 'Desactivar usuario' : 'Reactivar usuario';
  }

  statusActionConfirmationLabel(user: AdminUserApiDto): string {
    return user.estado ? 'Confirmar desactivacion' : 'Confirmar reactivacion';
  }

  statusActionDescription(user: AdminUserApiDto): string {
    return user.estado
      ? 'Esta accion inhabilita el acceso de la cuenta sin borrar su historial.'
      : 'Esta accion habilita nuevamente la cuenta para operar en la plataforma.';
  }

  formatDate(value: string | null): string {
    if (!value) return 'No registrada';

    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  trackUser(_: number, user: AdminUserApiDto): number {
    return user.idUsuario;
  }

  readonly currentPage = computed(() => this.pageInfo()?.paginaActual ?? this.page());
  readonly totalPages = computed(() => this.pageInfo()?.totalPaginas ?? 0);
  readonly displayedCount = computed(() => this.users().length);
  readonly isFirstPage = computed(() => this.currentPage() <= 0);
  readonly isLastPage = computed(() => this.pageInfo()?.ultimaPagina ?? true);

  private loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.actionMessage.set('');

    this.adminUserApi
      .getUsers({
        estado: this.filter(),
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
          this.users.set(pageData.contenido);
          this.selectedUserId.set(pageData.contenido[0]?.idUsuario ?? null);
        },
        error: () => {
          this.pageInfo.set(null);
          this.users.set([]);
          this.selectedUserId.set(null);
          this.errorMessage.set('No se pudieron cargar los usuarios administrativos.');
        },
      });
  }

  private deactivateUser(user: AdminUserApiDto): void {
    this.actionUserId.set(user.idUsuario);
    this.errorMessage.set('');
    this.actionMessage.set('');

    this.adminUserApi
      .deactivateUser(user.idUsuario)
      .pipe(
        finalize(() => this.actionUserId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.pendingStatusChangeId.set(null);
          this.loadUsers();
          this.actionMessage.set('Usuario desactivado correctamente.');
        },
        error: () => {
          this.errorMessage.set('No se pudo desactivar el usuario gestionable.');
        },
      });
  }

  private reactivateUser(user: AdminUserApiDto): void {
    this.actionUserId.set(user.idUsuario);
    this.errorMessage.set('');
    this.actionMessage.set('');

    this.adminUserApi
      .reactivateUser(user.idUsuario)
      .pipe(
        finalize(() => this.actionUserId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.pendingStatusChangeId.set(null);
          this.loadUsers();
          this.actionMessage.set('Usuario reactivado correctamente.');
        },
        error: () => {
          this.errorMessage.set('No se pudo reactivar el usuario gestionable.');
        },
      });
  }

  private parseStatusFilter(value: string | null): AdminUserStatusFilterApi {
    if (value === 'ACTIVO' || value === 'INACTIVO') {
      return value;
    }

    return 'TODOS';
  }

  private parseSearchField(value: string | null): AdminUserSearchFieldApi {
    if (value === 'CORREO' || value === 'TELEFONO' || value === 'ID_USUARIO') {
      return value;
    }

    return 'NOMBRE';
  }

  private parseSort(value: string | null): AdminUserSortApi {
    if (
      value === 'idUsuario,desc' ||
      value === 'nombre,asc' ||
      value === 'nombre,desc' ||
      value === 'correo,asc' ||
      value === 'fechaCreacion,desc'
    ) {
      return value;
    }

    return 'idUsuario,asc';
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
