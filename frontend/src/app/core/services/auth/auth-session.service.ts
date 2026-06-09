import { Injectable, computed, signal } from '@angular/core';

export type UserRole = 'Cliente' | 'Proveedor' | 'Administrador';

// Usuario de sesion mock usado mientras el frontend no consume autenticacion real.
export interface SessionUser {
  fullName: string;
  email: string;
  role: UserRole;
}

// Item de navegacion condicionado por rol para mantener la navbar dinamica.
export interface RoleNavItem {
  label: string;
  route: string;
  roles: UserRole[];
}

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly storageKey = 'regalia_mock_session';
  private readonly userSignal = signal<SessionUser | null>(this.restoreSession());

  readonly currentUser = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly role = computed(() => this.currentUser()?.role ?? null);

  readonly roleNavItems: RoleNavItem[] = [
    { label: 'Mi cuenta', route: '/dashboard', roles: ['Cliente', 'Proveedor', 'Administrador'] },
    { label: 'Mis reservas', route: '/mis-reservas', roles: ['Cliente', 'Proveedor', 'Administrador'] },
    { label: 'Perfil proveedor', route: '/perfil-proveedor', roles: ['Proveedor', 'Administrador'] },
    { label: 'Usuarios', route: '/admin/usuarios', roles: ['Administrador'] },
  ];

  login(email: string, role: UserRole): void {
    const user: SessionUser = {
      fullName: this.nameFromEmail(email),
      email,
      role,
    };

    this.persistSession(user);
  }

  register(fullName: string, email: string, role: UserRole): void {
    this.persistSession({ fullName, email, role });
  }

  logout(): void {
    this.userSignal.set(null);
    this.storage?.removeItem(this.storageKey);
  }

  homeForRole(role: UserRole): string {
    if (role === 'Administrador') return '/panel';
    if (role === 'Proveedor') return '/perfil-proveedor';
    return '/dashboard';
  }

  navForCurrentRole(): RoleNavItem[] {
    const role = this.role();
    return role ? this.roleNavItems.filter((item) => item.roles.includes(role)) : [];
  }

  canAccess(roles: UserRole[]): boolean {
    const role = this.role();
    return role !== null && roles.includes(role);
  }

  private persistSession(user: SessionUser): void {
    this.userSignal.set(user);
    this.storage?.setItem(this.storageKey, JSON.stringify(user));
  }

  private restoreSession(): SessionUser | null {
    const rawSession = this.storage?.getItem(this.storageKey);

    if (!rawSession) return null;

    try {
      return JSON.parse(rawSession) as SessionUser;
    } catch {
      this.storage?.removeItem(this.storageKey);
      return null;
    }
  }

  private get storage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }

  private nameFromEmail(email: string): string {
    const [name] = email.split('@');
    return name ? name.replace(/[._-]+/g, ' ') : 'Usuario REGALIA';
  }
}
