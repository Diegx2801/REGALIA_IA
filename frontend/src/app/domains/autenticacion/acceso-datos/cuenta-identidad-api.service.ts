import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi } from '../../../shared/modelos/respuesta-api.model';
import {
  mapearGoogleIdentityLinkDesdeDto,
  mapearIdentidadCuentaDesdeDto,
} from '../mapeadores/autenticacion.mapper';
import {
  AccountIdentityResponseDto,
  GoogleIdentityLinkResponseDto,
} from '../modelos/autenticacion.dto';
import { IdentidadCuenta } from '../modelos/autenticacion.model';

@Injectable({ providedIn: 'root' })
export class CuentaIdentidadApiService {
  private readonly http = inject(HttpClient);

  listarIdentidades(): Observable<IdentidadCuenta[]> {
    return this.http
      .get<RespuestaApi<AccountIdentityResponseDto[]>>(ENDPOINTS_API.cuenta.identidades)
      .pipe(
        map((respuesta) => (respuesta.data ?? []).map(mapearIdentidadCuentaDesdeDto)),
      );
  }

  vincularGoogle(idToken: string): Observable<IdentidadCuenta> {
    return this.http
      .post<RespuestaApi<GoogleIdentityLinkResponseDto>>(
        ENDPOINTS_API.cuenta.vincularGoogle,
        { idToken },
      )
      .pipe(
        map((respuesta) => {
          if (!respuesta.data) {
            throw new Error(respuesta.message ?? 'No se pudo vincular Google.');
          }

          return mapearGoogleIdentityLinkDesdeDto(respuesta.data);
        }),
      );
  }
}
