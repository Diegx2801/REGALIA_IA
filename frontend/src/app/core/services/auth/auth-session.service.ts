import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';

export type UserRole = 'Cliente' | 'Proveedor' | 'Administrador';
export type BackendRole = 'CLIENTE' | 'VENDEDOR' | 'ADMIN';

export interface ApiResponse<T> {
  status: 'success' | 'fail' | 'error';
  data: T;
  message: string | null;
}

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

interface LoginResponse {
  token: string;
  tipo: string;
  idUsuario: number;
  correo: string;
  roles: BackendRole[];
  expiraEnMinutos: number;
}

export interface RegisterRequest {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  contrasena: string;
}

export interface UserResponse {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  estado: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string | null;
}

export interface SessionUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  roles: UserRole[];
  token: string;
  tokenType: string;
  expiresAt: number;
}

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';
  private readonly storageKey = 'regalia_session';
  private readonly userSignal = signal<SessionUser | null>(this.restoreSession());

  readonly currentUser = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => {
    const session = this.currentUser();
    return session !== null && session.expiresAt > Date.now();
  });
  readonly role = computed(() => this.currentUser()?.role ?? null);

  login(request: LoginRequest, remember: boolean): Observable<SessionUser> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/auth/login`, request).pipe(
      map((response) => this.toSession(response.data)),
      tap((session) => this.persistSession(session, remember)),
      switchMap((session) =>
        this.http.get<ApiResponse<UserResponse>>(`${this.apiUrl}/usuarios/me`).pipe(
          map(({ data }) => this.withIdentity(session, data.nombres, data.apellidos)),
          tap((enrichedSession) => this.persistSession(enrichedSession, remember)),
          catchError(() => of(session)),
        ),
      ),
    );
  }

  register(request: RegisterRequest, remember = true): Observable<SessionUser> {
    return this.http.post<ApiResponse<UserResponse>>(`${this.apiUrl}/usuarios`, request).pipe(
      switchMap(() =>
        this.login(
          {
            correo: request.correo,
            contrasena: request.contrasena,
          },
          remember,
        ),
      ),
    );
  }

  updateIdentity(nombres: string, apellidos: string): void {
    const current = this.currentUser();
    if (!current) return;

    const updated = this.withIdentity(current, nombres, apellidos);
    const remember = localStorage.getItem(this.storageKey) !== null;
    this.persistSession(updated, remember);
  }

  logout(): void {
    this.userSignal.set(null);
    localStorage.removeItem(this.storageKey);
    sessionStorage.removeItem(this.storageKey);
  }

  homeForCurrentUser(): string {
    const role = this.role();
    if (role === 'Administrador') return '/admin/resumen';
    if (role === 'Proveedor') return '/proveedor/resumen';
    return '/cliente/inicio';
  }

  canAccess(roles: UserRole[]): boolean {
    const userRoles = this.currentUser()?.roles ?? [];
    return roles.some((role) => userRoles.includes(role));
  }

  private toSession(response: LoginResponse): SessionUser {
    const roles = response.roles.map((role) => this.toUserRole(role));
    const role = this.resolvePrimaryRole(roles);

    return {
      id: response.idUsuario,
      fullName: this.nameFromEmail(response.correo),
      email: response.correo,
      role,
      roles,
      token: response.token,
      tokenType: response.tipo,
      expiresAt: Date.now() + response.expiraEnMinutos * 60_000,
    };
  }

  private withIdentity(session: SessionUser, nombres: string, apellidos: string): SessionUser {
    const fullName = `${nombres} ${apellidos}`.trim();
    return {
      ...session,
      fullName: fullName || session.fullName,
    };
  }

  private persistSession(user: SessionUser, remember: boolean): void {
    const serializedSession = JSON.stringify(user);

    localStorage.removeItem(this.storageKey);
    sessionStorage.removeItem(this.storageKey);

    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(this.storageKey, serializedSession);
    this.userSignal.set(user);
  }

  private restoreSession(): SessionUser | null {
    const rawSession =
      localStorage.getItem(this.storageKey) ?? sessionStorage.getItem(this.storageKey);

    if (!rawSession) return null;

    try {
      const session = JSON.parse(rawSession) as SessionUser;
      if (session.expiresAt <= Date.now()) {
        localStorage.removeItem(this.storageKey);
        sessionStorage.removeItem(this.storageKey);
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(this.storageKey);
      sessionStorage.removeItem(this.storageKey);
      return null;
    }
  }

  private toUserRole(role: BackendRole): UserRole {
    if (role === 'ADMIN') return 'Administrador';
    if (role === 'VENDEDOR') return 'Proveedor';
    return 'Cliente';
  }

  private resolvePrimaryRole(roles: UserRole[]): UserRole {
    if (roles.includes('Administrador')) return 'Administrador';
    if (roles.includes('Proveedor')) return 'Proveedor';
    return 'Cliente';
  }

  private nameFromEmail(email: string): string {
    const [name] = email.split('@');
    return name ? name.replace(/[._-]+/g, ' ') : 'Usuario REGALIA';
  }
}
