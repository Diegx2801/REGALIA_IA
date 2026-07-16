import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';

import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi } from '../../../shared/modelos/respuesta-api.model';
import { VerificacionCorreoResponseDto } from '../modelos/verificacion-correo.dto';
import { ResultadoVerificacionCorreo } from '../modelos/verificacion-correo.model';

const TIEMPO_ESPERA_VERIFICACION_CORREO_MS = 10000;

@Injectable({ providedIn: 'root' })
export class VerificacionCorreoApiService {
  private readonly http = inject(HttpClient);

  confirmar(token: string): Observable<ResultadoVerificacionCorreo> {
    const params = new HttpParams().set('token', token);

    return this.http
      .get<RespuestaApi<VerificacionCorreoResponseDto>>(
        ENDPOINTS_API.autenticacion.confirmarVerificacionCorreo,
        { params },
      )
      .pipe(
        timeout(TIEMPO_ESPERA_VERIFICACION_CORREO_MS),
        map((respuesta) => {
          if (!respuesta.data) {
            throw new Error(respuesta.message ?? 'No se pudo confirmar el correo.');
          }

          return {
            idUsuario: respuesta.data.idUsuario,
            correo: respuesta.data.correo,
            verificado: respuesta.data.verificado,
          };
        }),
      );
  }
}
