import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolUsuario } from '../autenticacion/sesion-autenticacion.model';
import { SesionAutenticacionService } from '../autenticacion/sesion-autenticacion.service';

export const rolGuard: CanActivateFn = (route) => {
  const sesion = inject(SesionAutenticacionService);
  const router = inject(Router);
  const rolesPermitidos = (route.data['roles'] ?? []) as RolUsuario[];

  // La autorizacion visual no reemplaza la validacion obligatoria del backend.
  if (rolesPermitidos.length === 0 || sesion.tieneRol(rolesPermitidos)) return true;

  return router.createUrlTree(['/acceso-denegado']);
};
