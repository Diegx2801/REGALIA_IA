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
  private readonly activeContextSignal = signal<AuthContext>('PUBLIC');
  private readonly publicUserSignal = signal<SessionUser | null>(this.authStorage.read('PUBLIC'));
  private readonly adminUserSignal = signal<SessionUser | null>(this.authStorage.read('ADMIN'));

  readonly currentUser = computed(() => this.sessionFor(this.activeContextSignal()));

  readonly isLoggedIn = computed(() => this.isSessionActive(this.currentUser()));

  readonly role = computed(() => this.currentUser()?.role ?? null);

  setActiveContext(context: AuthContext): void {
    this.activeContextSignal.set(context);
  }

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
    const remember = this.authStorage.isPersistent(current.authContext);
    this.persistSession(updated, remember);
  }

  logout(context = this.activeContextSignal()): void {
    this.authStorage.clear(context);
    this.setSessionFor(context, null);
  }

  homeForCurrentUser(): string {
    const session = this.currentUser();

    if (session?.authContext === 'ADMIN' && session.roles.includes('Administrador')) {
      return '/admin/resumen';
    }

    if (session?.roles.includes('Vendedor')) {
      return '/vendedor/resumen';
    }

    return '/cliente/inicio';
  }

  canAccess(roles: UserRole[], requiredContext?: AuthContext): boolean {
    const session = requiredContext ? this.sessionFor(requiredContext) : this.currentUser();

    if (!this.isSessionActive(session)) return false;

    if (requiredContext && session.authContext !== requiredContext) {
      return false;
    }

    return roles.some((role) => session.roles.includes(role));
  }

  hasAuthContext(requiredContext: AuthContext): boolean {
    return this.isSessionActive(this.sessionFor(requiredContext));
  }

  isLoggedInFor(context: AuthContext): boolean {
    return this.isSessionActive(this.sessionFor(context));
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
    this.setSessionFor(user.authContext, user);
    this.activeContextSignal.set(user.authContext);
  }

  private sessionFor(context: AuthContext): SessionUser | null {
    return context === 'ADMIN' ? this.adminUserSignal() : this.publicUserSignal();
  }

  private setSessionFor(context: AuthContext, session: SessionUser | null): void {
    if (context === 'ADMIN') {
      this.adminUserSignal.set(session);
      return;
    }

    this.publicUserSignal.set(session);
  }

  private isSessionActive(session: SessionUser | null): session is SessionUser {
    return session !== null && session.expiresAt > Date.now();
  }

  private toUserRole(role: BackendRole): UserRole {
    if (role === 'ADMIN') return 'Administrador';
    if (role === 'VENDEDOR') return 'Vendedor';
    return 'Cliente';
  }

  private resolvePrimaryRole(roles: UserRole[]): UserRole {
    if (roles.includes('Administrador')) return 'Administrador';
    if (roles.includes('Vendedor')) return 'Vendedor';
    return 'Cliente';
  }

  private nameFromEmail(email: string): string {
    const [name] = email.split('@');
    return name ? name.replace(/[._-]+/g, ' ') : 'Usuario REGALIA';
  }
}
