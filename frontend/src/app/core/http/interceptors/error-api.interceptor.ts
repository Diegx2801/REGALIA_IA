import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const errorApiInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      // Normaliza errores HTTP para que formularios y pantallas muestren mensajes consistentes.
      const mensaje =
        error instanceof HttpErrorResponse
          ? (error.error?.message ?? error.message)
          : 'No se pudo completar la operacion.';

      return throwError(() => new Error(mensaje));
    }),
  );
