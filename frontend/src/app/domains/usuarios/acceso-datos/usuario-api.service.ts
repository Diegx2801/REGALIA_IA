import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi } from '../../../shared/modelos/respuesta-api.model';
import {
  mapearSolicitudCrearUsuarioADto,
  mapearSolicitudActualizarPerfilADto,
  mapearUsuarioPerfilDesdeDto,
} from '../mapeadores/usuario.mapper';
import { UsuarioPerfilDto } from '../modelos/usuario.dto';
import {
  SolicitudActualizarPerfilUsuario,
  SolicitudCrearUsuario,
  UsuarioPerfil,
} from '../modelos/usuario.model';

const TIEMPO_ESPERA_USUARIO_MS = 10000;

@Injectable({ providedIn: 'root' })
export class UsuarioApiService {
  private readonly http = inject(HttpClient);

  crearUsuario(solicitud: SolicitudCrearUsuario): Observable<UsuarioPerfil> {
    return this.http
      .post<RespuestaApi<UsuarioPerfilDto>>(
        ENDPOINTS_API.usuarios.crear,
        mapearSolicitudCrearUsuarioADto(solicitud),
      )
      .pipe(
        timeout(TIEMPO_ESPERA_USUARIO_MS),
        map((respuesta) => {
          if (!respuesta.data) throw new Error(respuesta.message ?? 'No se pudo crear la cuenta.');
          return mapearUsuarioPerfilDesdeDto(respuesta.data);
        }),
      );
  }

  obtenerPerfilActual(): Observable<UsuarioPerfil> {
    return this.http.get<RespuestaApi<UsuarioPerfilDto>>(ENDPOINTS_API.usuarios.perfilActual).pipe(
      timeout(TIEMPO_ESPERA_USUARIO_MS),
      map((respuesta) => {
        if (!respuesta.data) throw new Error(respuesta.message ?? 'No se pudo cargar el perfil.');
        return mapearUsuarioPerfilDesdeDto(respuesta.data);
      }),
    );
  }

  actualizarPerfil(solicitud: SolicitudActualizarPerfilUsuario): Observable<UsuarioPerfil> {
    return this.http
      .put<RespuestaApi<UsuarioPerfilDto>>(
        ENDPOINTS_API.usuarios.perfilActual,
        mapearSolicitudActualizarPerfilADto(solicitud),
      )
      .pipe(
        timeout(TIEMPO_ESPERA_USUARIO_MS),
        map((respuesta) => {
          if (!respuesta.data) throw new Error(respuesta.message ?? 'No se pudo actualizar el perfil.');
          return mapearUsuarioPerfilDesdeDto(respuesta.data);
        }),
      );
  }
}
