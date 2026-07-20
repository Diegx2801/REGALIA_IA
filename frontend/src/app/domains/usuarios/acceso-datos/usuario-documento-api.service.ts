import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi } from '../../../shared/modelos/respuesta-api.model';
import {
  mapearConsultaRucDesdeDto,
  mapearSolicitudRegistrarDocumentoADto,
  mapearUsuarioDocumentoDesdeDto,
  normalizarNumeroDocumento,
} from '../mapeadores/usuario-documento.mapper';
import { ConsultaRucDto, UsuarioDocumentoDto } from '../modelos/usuario-documento.dto';
import {
  ConsultaRuc,
  SolicitudRegistrarDocumento,
  UsuarioDocumento,
} from '../modelos/usuario-documento.model';

const TIEMPO_ESPERA_DOCUMENTOS_MS = 10000;

@Injectable({ providedIn: 'root' })
export class UsuarioDocumentoApiService {
  private readonly http = inject(HttpClient);

  obtenerDocumentos(): Observable<UsuarioDocumento[]> {
    return this.http
      .get<RespuestaApi<UsuarioDocumentoDto[]>>(ENDPOINTS_API.usuarios.documentos)
      .pipe(
        timeout(TIEMPO_ESPERA_DOCUMENTOS_MS),
        map((respuesta) => (respuesta.data ?? []).map(mapearUsuarioDocumentoDesdeDto)),
      );
  }

  registrarDocumento(solicitud: SolicitudRegistrarDocumento): Observable<UsuarioDocumento> {
    return this.http
      .post<RespuestaApi<UsuarioDocumentoDto>>(
        ENDPOINTS_API.usuarios.documentos,
        mapearSolicitudRegistrarDocumentoADto(solicitud),
      )
      .pipe(
        timeout(TIEMPO_ESPERA_DOCUMENTOS_MS),
        map((respuesta) => this.mapearDocumentoRequerido(respuesta)),
      );
  }

  consultarRuc(numeroRuc: string): Observable<ConsultaRuc> {
    const numeroNormalizado = normalizarNumeroDocumento(numeroRuc);

    return this.http
      .get<RespuestaApi<ConsultaRucDto>>(ENDPOINTS_API.usuarios.consultarRuc(numeroNormalizado))
      .pipe(
        timeout(TIEMPO_ESPERA_DOCUMENTOS_MS),
        map((respuesta) => {
          if (!respuesta.data) {
            throw new Error(respuesta.message ?? 'No se encontraron datos para el RUC indicado.');
          }

          return mapearConsultaRucDesdeDto(respuesta.data);
        }),
      );
  }

  registrarRuc(numeroRuc: string): Observable<UsuarioDocumento> {
    return this.http
      .post<RespuestaApi<UsuarioDocumentoDto>>(ENDPOINTS_API.usuarios.registrarRuc, {
        numeroRuc: normalizarNumeroDocumento(numeroRuc),
      })
      .pipe(
        timeout(TIEMPO_ESPERA_DOCUMENTOS_MS),
        map((respuesta) => this.mapearDocumentoRequerido(respuesta)),
      );
  }

  private mapearDocumentoRequerido(respuesta: RespuestaApi<UsuarioDocumentoDto>): UsuarioDocumento {
    if (!respuesta.data) {
      throw new Error(respuesta.message ?? 'No se pudo registrar el documento.');
    }

    return mapearUsuarioDocumentoDesdeDto(respuesta.data);
  }
}
