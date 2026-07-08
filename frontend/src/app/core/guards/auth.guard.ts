import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../services/auth/auth-session.service';
import { AuthContext, UserRole } from '../services/auth/auth-session.model';

function loginRouteFor(url: string): string {
  return url.startsWith('/admin') ? '/admin/login' : '/login';
}

export const authGuard: CanActivateFn = (_route, state) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);
  const authContext: AuthContext = state.url.startsWith('/admin') ? 'ADMIN' : 'PUBLIC';

  authSession.setActiveContext(authContext);

  // AUTENTICACION: valida si existe sesion activa antes de dejar entrar a una ruta privada.
  return authSession.isLoggedInFor(authContext)
    ? true
    : router.createUrlTree([loginRouteFor(state.url)], {
        queryParams: { returnUrl: state.url },
      });
};

export const guestGuard: CanActivateFn = () => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  authSession.setActiveContext('PUBLIC');

  return authSession.isLoggedInFor('PUBLIC')
    ? router.createUrlTree([authSession.homeForCurrentUser()])
    : true;
};

export const adminGuestGuard: CanActivateFn = () => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  authSession.setActiveContext('ADMIN');

  if (authSession.isLoggedInFor('ADMIN') && authSession.hasAuthContext('ADMIN')) {
    return router.createUrlTree(['/admin/resumen']);
  }

  return true;
};

export const roleGuard: CanActivateFn = (route, state) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  const roles = (route.data['roles'] ?? []) as UserRole[];
  const authContext = route.data['authContext'] as AuthContext | undefined;
  const expectedContext: AuthContext =
    authContext ?? (state.url.startsWith('/admin') ? 'ADMIN' : 'PUBLIC');

  authSession.setActiveContext(expectedContext);

  if (!authSession.isLoggedInFor(expectedContext)) {
    return router.createUrlTree([loginRouteFor(state.url)], {
      queryParams: { returnUrl: state.url },
    });
  }

  if (authContext && !authSession.hasAuthContext(authContext)) {
    const loginRoute = authContext === 'ADMIN' ? '/admin/login' : '/login';

    return router.createUrlTree([loginRoute], {
      queryParams: { returnUrl: state.url },
    });
  }

  // AUTORIZACION: despues de autenticar, compara el rol requerido con el rol real del usuario.
  return authSession.canAccess(roles, authContext)
    ? true
    : router.createUrlTree(['/acceso-denegado'], {
        queryParams: { desde: state.url },
      });
};

export const roleRedirectGuard: CanActivateFn = (route) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  authSession.setActiveContext('PUBLIC');

  const redirects = (route.data['redirects'] ?? {}) as Partial<Record<UserRole, string>>;
  const role = authSession.role();

  const destination = (role ? redirects[role] : null) ?? authSession.homeForCurrentUser();

  return router.createUrlTree([destination]);
};
