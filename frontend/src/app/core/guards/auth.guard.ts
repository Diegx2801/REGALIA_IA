import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService, UserRole } from '../services/auth/auth-session.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  return authSession.isLoggedIn()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const guestGuard: CanActivateFn = () => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  return authSession.isLoggedIn() ? router.createUrlTree([authSession.homeForCurrentUser()]) : true;
};

export const roleGuard: CanActivateFn = (route, state) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);
  const roles = (route.data['roles'] ?? []) as UserRole[];

  if (!authSession.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  return authSession.canAccess(roles)
    ? true
    : router.createUrlTree(['/acceso-denegado'], { queryParams: { desde: state.url } });
};

export const roleRedirectGuard: CanActivateFn = (route) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);
  const redirects = (route.data['redirects'] ?? {}) as Partial<Record<UserRole, string>>;
  const role = authSession.role();
  const destination = (role ? redirects[role] : null) ?? authSession.homeForCurrentUser();

  return router.createUrlTree([destination]);
};
