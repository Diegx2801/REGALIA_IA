import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AdminUserApiDto,
  AdminUserSearchFieldApi,
  AdminUserStatusFilterApi,
} from '../../core/services/data-access/regalia/models/admin-user-api.model';
import { RegaliaAdminUserApiService } from '../../core/services/data-access/regalia/services/regalia-admin-user-api.service';

<<<<<<< HEAD
interface AdminUserFilterOption {
  value: AdminUserStatusFilterApi;
  label: string;
=======
// Fila visible en la administración simulada de usuarios y roles.
interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: 'Activo' | 'Pendiente' | 'Suspendido';
  lastAccess: string;
>>>>>>> origin/main
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

<<<<<<< HEAD
  readonly filterOptions = FILTER_OPTIONS;
  readonly searchFieldOptions = SEARCH_FIELD_OPTIONS;
  readonly filter = signal<AdminUserStatusFilterApi>('TODOS');
  readonly searchField = signal<AdminUserSearchFieldApi>('NOMBRE');
  readonly searchTerm = signal('');
  readonly users = signal<AdminUserApiDto[]>([]);
  readonly selectedUserId = signal<number | null>(null);
  readonly pendingStatusChangeId = signal<number | null>(null);
  readonly actionUserId = signal<number | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly actionMessage = signal('');
=======
  // Usuarios simulados para validar la interfaz de administración antes de conectar endpoints reales.
  readonly users: AdminUserRow[] = [
    { id: 1, name: 'Andrea Mendoza', email: 'andrea@regalia.pe', role: 'Cliente', status: 'Activo', lastAccess: 'Hoy' },
    { id: 2, name: 'Floralia Studio', email: 'ventas@floralia.pe', role: 'Proveedor', status: 'Activo', lastAccess: 'Ayer' },
    { id: 3, name: 'Dulce Detalle', email: 'contacto@dulcedetalle.pe', role: 'Proveedor', status: 'Pendiente', lastAccess: 'Hace 2 dias' },
    { id: 4, name: 'Operaciones REGALIA', email: 'admin@regalia.pe', role: 'Administrador', status: 'Activo', lastAccess: 'Hoy' },
  ];
>>>>>>> origin/main

  readonly selectedUser = computed<AdminUserApiDto | null>(() => {
    const selectedUserId = this.selectedUserId();

    return (
      this.users().find((user) => user.idUsuario === selectedUserId) ??
      this.users()[0] ??
      null
    );
  });

  readonly totalCount = computed(() => this.users().length);
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
      this.selectedUserId.set(null);
      this.pendingStatusChangeId.set(null);
      this.loadUsers();
    });
  }

  setFilter(filter: AdminUserStatusFilterApi): void {
    this.updateQueryParams({ estado: filter === 'TODOS' ? null : filter });
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
    return this.selectedUser()?.idUsuario === user.idUsuario;
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

  private loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.actionMessage.set('');

    this.adminUserApi
      .getUsers({
        estado: this.filter(),
        searchField: this.searchField(),
        search: this.searchTerm(),
      })
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (users) => {
          this.users.set(users);
          this.selectedUserId.set(users[0]?.idUsuario ?? null);
        },
        error: () => {
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
        next: (updatedUser) => {
          this.replaceUser(updatedUser);
          this.pendingStatusChangeId.set(null);
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
        next: (updatedUser) => {
          this.replaceUser(updatedUser);
          this.pendingStatusChangeId.set(null);
          this.actionMessage.set('Usuario reactivado correctamente.');
        },
        error: () => {
          this.errorMessage.set('No se pudo reactivar el usuario gestionable.');
        },
      });
  }

  private replaceUser(updatedUser: AdminUserApiDto): void {
    this.users.update((users) =>
      users.map((user) => (user.idUsuario === updatedUser.idUsuario ? updatedUser : user)),
    );
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

  private updateQueryParams(queryParams: Record<string, string | null>): void {
    void this.router.navigate([], {
      queryParams,
      queryParamsHandling: 'merge',
      relativeTo: this.route,
      replaceUrl: true,
    });
  }
}
