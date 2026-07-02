import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UserRole } from '../../core/services/auth/auth-session.model';

// Fila visible en la administración simulada de usuarios y roles.
interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: 'Activo' | 'Pendiente' | 'Suspendido';
  lastAccess: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsersComponent {
  readonly roleFilter = new FormControl<UserRole | 'Todos'>('Todos', { nonNullable: true });
  private readonly filterVersion = signal(0);

  // Usuarios simulados para validar la interfaz de administración antes de conectar endpoints reales.
  readonly users: AdminUserRow[] = [
    { id: 1, name: 'Andrea Mendoza', email: 'andrea@regalia.pe', role: 'Cliente', status: 'Activo', lastAccess: 'Hoy' },
    { id: 2, name: 'Floralia Studio', email: 'ventas@floralia.pe', role: 'Proveedor', status: 'Activo', lastAccess: 'Ayer' },
    { id: 3, name: 'Dulce Detalle', email: 'contacto@dulcedetalle.pe', role: 'Proveedor', status: 'Pendiente', lastAccess: 'Hace 2 dias' },
    { id: 4, name: 'Operaciones REGALIA', email: 'admin@regalia.pe', role: 'Administrador', status: 'Activo', lastAccess: 'Hoy' },
  ];

  readonly filteredUsers = computed(() => {
    this.filterVersion();
    const role = this.roleFilter.value;
    return role === 'Todos' ? this.users : this.users.filter((user) => user.role === role);
  });

  onFilterChanged(): void {
    this.filterVersion.update((value) => value + 1);
  }

  trackUser(_: number, user: AdminUserRow): number {
    return user.id;
  }
}
