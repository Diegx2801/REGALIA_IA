import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthContext, AuthSessionService, UserRole } from '../services/auth/auth-session.service';

function loginRouteFor(url: string): string {
  return url.startsWith('/admin') ? '/admin/login' : '/login';
}

export const authGuard: CanActivateFn = (_route, state) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  return authSession.isLoggedIn()
    ? true
    : router.createUrlTree([loginRouteFor(state.url)], {
        queryParams: { returnUrl: state.url },
      });
};

export const guestGuard: CanActivateFn = () => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  return authSession.isLoggedIn()
    ? router.createUrlTree([authSession.homeForCurrentUser()])
    : true;
};

export const adminGuestGuard: CanActivateFn = () => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  if (authSession.isLoggedIn() && authSession.hasAuthContext('ADMIN')) {
    return router.createUrlTree(['/admin/resumen']);
  }

  return true;
};

export const roleGuard: CanActivateFn = (route, state) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  const roles = (route.data['roles'] ?? []) as UserRole[];
  const authContext = route.data['authContext'] as AuthContext | undefined;

  if (!authSession.isLoggedIn()) {
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

  return authSession.canAccess(roles, authContext)
    ? true
    : router.createUrlTree(['/acceso-denegado'], {
        queryParams: { desde: state.url },
      });
};

export const roleRedirectGuard: CanActivateFn = (route) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  const redirects = (route.data['redirects'] ?? {}) as Partial<Record<UserRole, string>>;
  const role = authSession.role();

  const destination = (role ? redirects[role] : null) ?? authSession.homeForCurrentUser();

  return router.createUrlTree([destination]);
};