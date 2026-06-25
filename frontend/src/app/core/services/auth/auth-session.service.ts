import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { API_ENDPOINTS } from '../../config/api.config';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { AuthStorageService } from './auth-storage.service';
import {
  AuthContext,
  BackendRole,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  SessionUser,
  UserResponse,
  UserRole,
} from './auth-session.model';

type LoginEndpoint = typeof API_ENDPOINTS.auth.login | typeof API_ENDPOINTS.auth.adminLogin;

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly http = inject(HttpClient);
  private readonly authStorage = inject(AuthStorageService);
  private readonly userSignal = signal<SessionUser | null>(this.authStorage.read());

  readonly currentUser = this.userSignal.asReadonly();

  readonly isLoggedIn = computed(() => {
    const session = this.currentUser();
    return session !== null && session.expiresAt > Date.now();
  });

  readonly role = computed(() => this.currentUser()?.role ?? null);

  login(request: LoginRequest, remember: boolean): Observable<SessionUser> {
    return this.loginWithContext(API_ENDPOINTS.auth.login, request, remember, 'PUBLIC');
  }

  loginAdmin(request: LoginRequest, remember: boolean): Observable<SessionUser> {
    return this.loginWithContext(API_ENDPOINTS.auth.adminLogin, request, remember, 'ADMIN');
  }

  register(request: RegisterRequest, remember = true): Observable<SessionUser> {
    return this.http.post<ApiResponse<UserResponse>>(API_ENDPOINTS.auth.register, request).pipe(
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
    const remember = this.authStorage.isPersistent();
    this.persistSession(updated, remember);
  }

  logout(): void {
    this.userSignal.set(null);
    this.authStorage.clear();
  }

  homeForCurrentUser(): string {
    const session = this.currentUser();

    if (session?.authContext === 'ADMIN' && session.roles.includes('Administrador')) {
      return '/admin/resumen';
    }

    if (session?.roles.includes('Proveedor')) {
      return '/proveedor/resumen';
    }

    return '/cliente/inicio';
  }

  canAccess(roles: UserRole[], requiredContext?: AuthContext): boolean {
    const session = this.currentUser();

    if (!session) return false;

    if (requiredContext && session.authContext !== requiredContext) {
      return false;
    }

    return roles.some((role) => session.roles.includes(role));
  }

  hasAuthContext(requiredContext: AuthContext): boolean {
    return this.currentUser()?.authContext === requiredContext;
  }

  private loginWithContext(
    endpoint: LoginEndpoint,
    request: LoginRequest,
    remember: boolean,
    expectedContext: AuthContext,
  ): Observable<SessionUser> {
    return this.http.post<ApiResponse<LoginResponse>>(endpoint, request).pipe(
      map((response) => this.toSession(response.data, expectedContext)),
      tap((session) => this.persistSession(session, remember)),
      switchMap((session) => {
        if (session.authContext === 'ADMIN') {
          return of(session);
        }

        return this.http.get<ApiResponse<UserResponse>>(API_ENDPOINTS.users.me).pipe(
          map(({ data }) => this.withIdentity(session, data.nombres, data.apellidos)),
          tap((enrichedSession) => this.persistSession(enrichedSession, remember)),
          catchError(() => of(session)),
        );
      }),
    );
  }

  private toSession(response: LoginResponse, expectedContext: AuthContext): SessionUser {
    if (response.authContext !== expectedContext) {
      throw new Error('El contexto de autenticación recibido no coincide con el esperado.');
    }

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
      authContext: response.authContext,
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
    this.authStorage.save(user, remember);
    this.userSignal.set(user);
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
