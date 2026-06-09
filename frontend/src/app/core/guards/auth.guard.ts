import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService, UserRole } from '../services/auth/auth-session.service';

export const authGuard: CanActivateFn = () => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  // Protege vistas privadas mientras usamos sesion mock en localStorage.
  return authSession.isLoggedIn() || router.createUrlTree(['/login']);
};

export const roleGuard: CanActivateFn = (route) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);
  const roles = (route.data['roles'] ?? []) as UserRole[];

  // Primero exige sesion; luego valida que el rol tenga permiso para la ruta.
  if (!authSession.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  return authSession.canAccess(roles) || router.createUrlTree(['/dashboard']);
};
