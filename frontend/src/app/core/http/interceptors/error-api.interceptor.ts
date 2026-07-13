import { HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { normalizarErrorApi } from '../modelos/error-api.model';

export const errorApiInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      // Unifica errores HTTP para que cada pantalla reciba un contrato predecible.
      return throwError(() => normalizarErrorApi(error));
    }),
  );
