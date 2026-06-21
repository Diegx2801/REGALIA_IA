import { isDevMode, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Habilita las vistas de demostración únicamente durante desarrollo local.
 * En una compilación de producción redirige al inicio público.
 */
export const devPreviewGuard: CanActivateFn = () => {
  const router = inject(Router);
  return isDevMode() ? true : router.createUrlTree(['/']);
};
