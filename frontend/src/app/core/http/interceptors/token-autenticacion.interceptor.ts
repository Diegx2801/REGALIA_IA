import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SesionAutenticacionService } from '../../autenticacion/sesion-autenticacion.service';

export const tokenAutenticacionInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(SesionAutenticacionService).tokenActual();

  // Solo las llamadas al backend REGALIA reciben JWT.
  if (!token || !request.url.startsWith('/api')) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
