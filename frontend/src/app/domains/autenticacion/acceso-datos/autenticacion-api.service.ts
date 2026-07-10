import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi } from '../../../shared/modelos/respuesta-api.model';
import {
  mapearCredencialesLoginADto,
  mapearLoginDesdeDto,
} from '../mapeadores/autenticacion.mapper';
import { LoginResponseDto } from '../modelos/autenticacion.dto';
import { CredencialesLogin, ResultadoLogin } from '../modelos/autenticacion.model';

@Injectable({ providedIn: 'root' })
export class AutenticacionApiService {
  private readonly http = inject(HttpClient);

  iniciarSesionPublica(credenciales: CredencialesLogin): Observable<ResultadoLogin> {
    return this.iniciarSesion(ENDPOINTS_API.autenticacion.login, credenciales);
  }

  iniciarSesionAdministracion(credenciales: CredencialesLogin): Observable<ResultadoLogin> {
    return this.iniciarSesion(ENDPOINTS_API.autenticacion.loginAdministracion, credenciales);
  }

  private iniciarSesion(
    endpoint: string,
    credenciales: CredencialesLogin,
  ): Observable<ResultadoLogin> {
    return this.http
      .post<RespuestaApi<LoginResponseDto>>(endpoint, mapearCredencialesLoginADto(credenciales))
      .pipe(
        map((respuesta) => {
          if (!respuesta.data) throw new Error(respuesta.message ?? 'No se pudo iniciar sesion.');
          return mapearLoginDesdeDto(respuesta.data);
        }),
      );
  }
}
