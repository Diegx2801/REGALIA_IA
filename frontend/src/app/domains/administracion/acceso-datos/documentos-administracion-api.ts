import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi } from '../../../shared/modelos/respuesta-api.model';
import { mapearDocumentoAdministracion } from '../mapeadores/documento-administracion.mapper';
import { DocumentoAdministracionDto } from '../modelos/documento-administracion.dto';
import {
  DocumentoAdministracion,
  EstadoDocumentoAdministracion,
} from '../modelos/documento-administracion.model';

@Injectable({
  providedIn: 'root',
})
export class DocumentosAdministracionApi {
  private readonly http = inject(HttpClient);

  listar(estado?: EstadoDocumentoAdministracion): Observable<DocumentoAdministracion[]> {
    let params = new HttpParams();
    if (estado && estado !== 'DESCONOCIDO') params = params.set('estadoVerificacion', estado);
    return this.http
      .get<RespuestaApi<DocumentoAdministracionDto[]>>(ENDPOINTS_API.administracion.documentos, {
        params,
      })
      .pipe(map((respuesta) => (respuesta.data ?? []).map(mapearDocumentoAdministracion)));
  }

  obtenerPorId(idDocumento: number): Observable<DocumentoAdministracion> {
    return this.http
      .get<RespuestaApi<DocumentoAdministracionDto>>(
        ENDPOINTS_API.administracion.documentoPorId(idDocumento),
      )
      .pipe(map((respuesta) => this.extraerDocumento(respuesta)));
  }

  cambiarEstado(
    idDocumento: number,
    accion: 'verificar' | 'observar' | 'rechazar',
  ): Observable<DocumentoAdministracion> {
    return this.http
      .patch<RespuestaApi<DocumentoAdministracionDto>>(
        ENDPOINTS_API.administracion.accionDocumento(idDocumento, accion),
        null,
      )
      .pipe(map((respuesta) => this.extraerDocumento(respuesta)));
  }

  private extraerDocumento(
    respuesta: RespuestaApi<DocumentoAdministracionDto>,
  ): DocumentoAdministracion {
    if (!respuesta.data) throw new Error(respuesta.message ?? 'No se pudo cargar el documento.');
    return mapearDocumentoAdministracion(respuesta.data);
  }
}
