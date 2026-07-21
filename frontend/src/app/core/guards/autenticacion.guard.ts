import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionAutenticacionService } from '../autenticacion/sesion-autenticacion.service';

export const autenticacionGuard: CanActivateFn = (_route, state) => {
  const sesion = inject(SesionAutenticacionService);
  const router = inject(Router);

  // Protege rutas privadas antes de cargar dominios lazy.
  if (sesion.estaAutenticado()) return true;

  const rutaLogin = state.url.startsWith('/admin') ? '/admin/login' : '/login';
  return router.createUrlTree([rutaLogin], { queryParams: { retorno: state.url } });
};
