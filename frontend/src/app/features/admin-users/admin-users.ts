import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AdminUserApiDto } from '../../core/services/data-access/regalia/models/admin-user-api.model';
import { RegaliaAdminUserApiService } from '../../core/services/data-access/regalia/services/regalia-admin-user-api.service';

type AdminUserFilter = 'TODOS' | 'ACTIVOS' | 'INACTIVOS' | 'CON_TELEFONO' | 'SIN_TELEFONO';

interface AdminUserFilterOption {
  value: AdminUserFilter;
  label: string;
}

const FILTER_OPTIONS: AdminUserFilterOption[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'ACTIVOS', label: 'Activos' },
  { value: 'INACTIVOS', label: 'Inactivos' },
  { value: 'CON_TELEFONO', label: 'Con telefono' },
  { value: 'SIN_TELEFONO', label: 'Sin telefono' },
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
  private readonly destroyRef = inject(DestroyRef);

  readonly filterOptions = FILTER_OPTIONS;
  readonly filter = signal<AdminUserFilter>('TODOS');
  readonly searchTerm = signal('');
  readonly users = signal<AdminUserApiDto[]>([]);
  readonly selectedUserId = signal<number | null>(null);
  readonly pendingStatusChangeId = signal<number | null>(null);
  readonly actionUserId = signal<number | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly actionMessage = signal('');

  readonly filteredUsers = computed(() => {
    const normalizedSearch = this.normalize(this.searchTerm());
    const currentFilter = this.filter();

    return this.users().filter((user) => {
      const matchesFilter = this.matchesFilter(user, currentFilter);
      const matchesSearch =
        normalizedSearch.length === 0 ||
        this.normalize(
          [
            user.nombres,
            user.apellidos,
            user.correo,
            user.telefono,
            user.idUsuario,
          ].join(' '),
        ).includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  });

  readonly selectedUser = computed(() => {
    const filteredUsers = this.filteredUsers();
    const selectedUserId = this.selectedUserId();

    return (
      filteredUsers.find((user) => user.idUsuario === selectedUserId) ??
      filteredUsers[0] ??
      null
    );
  });

  readonly totalCount = computed(() => this.users().length);
  readonly activeCount = computed(() => this.users().filter((user) => Boolean(user.estado)).length);
  readonly inactiveCount = computed(() => this.users().filter((user) => !user.estado).length);
  readonly withPhoneCount = computed(
    () => this.users().filter((user) => Boolean(user.telefono?.trim())).length,
  );

  ngOnInit(): void {
    this.loadUsers();
  }

  setFilter(filter: AdminUserFilter): void {
    this.filter.set(filter);
    this.selectedUserId.set(null);
    this.pendingStatusChangeId.set(null);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.selectedUserId.set(null);
    this.pendingStatusChangeId.set(null);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.selectedUserId.set(null);
    this.pendingStatusChangeId.set(null);
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
      .getUsers('TODOS')
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (users) => {
          this.users.set(users);
          const selectedUserStillExists = users.some(
            (user) => user.idUsuario === this.selectedUserId(),
          );
          if (!selectedUserStillExists) {
            this.selectedUserId.set(users[0]?.idUsuario ?? null);
          }
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

  private matchesFilter(user: AdminUserApiDto, filter: AdminUserFilter): boolean {
    if (filter === 'ACTIVOS') return Boolean(user.estado);
    if (filter === 'INACTIVOS') return !user.estado;
    if (filter === 'CON_TELEFONO') return this.hasPhone(user);
    if (filter === 'SIN_TELEFONO') return !this.hasPhone(user);
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
