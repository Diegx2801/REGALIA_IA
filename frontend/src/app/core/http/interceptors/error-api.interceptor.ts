import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SesionAutenticacionService } from '../../autenticacion/sesion-autenticacion.service';
import { normalizarErrorApi } from '../modelos/error-api.model';

export const errorApiInterceptor: HttpInterceptorFn = (request, next) => {
  const sesion = inject(SesionAutenticacionService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && sesion.estaAutenticado()) {
        const rutaAnterior = obtenerRutaRetornoSegura(router.url);
        const esAdministracion =
          rutaAnterior?.startsWith('/admin') === true || sesion.tieneRol(['ADMIN']);

        sesion.cerrarSesionExpirada();
        queueMicrotask(() => {
          void router.navigate([esAdministracion ? '/admin/login' : '/login'], {
            replaceUrl: true,
            queryParams: rutaAnterior
              ? { retorno: rutaAnterior, motivo: 'sesion-expirada' }
              : undefined,
          });
        });
      }

      // Unifica errores HTTP para que cada pantalla reciba un contrato predecible.
      return throwError(() => normalizarErrorApi(error));
    }),
  );
};

function obtenerRutaRetornoSegura(ruta: string): string | null {
  if (!ruta.startsWith('/') || ruta.startsWith('//')) return null;
  if (ruta.startsWith('/login') || ruta.startsWith('/admin/login')) return null;
  return ruta;
}
