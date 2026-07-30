import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi, RespuestaPaginada } from '../../../shared/modelos/respuesta-api.model';
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

  listar(consulta: ConsultaDocumentosAdministracion = {}): Observable<RespuestaPaginada<DocumentoAdministracion>> {
    let params = new HttpParams();
    if (consulta.estado && consulta.estado !== 'DESCONOCIDO') {
      params = params.set('estadoVerificacion', consulta.estado);
    }
    if (consulta.campoBusqueda) params = params.set('campoBusqueda', consulta.campoBusqueda);
    if (consulta.busqueda?.trim()) params = params.set('busqueda', consulta.busqueda.trim());
    if (consulta.page !== undefined) params = params.set('page', consulta.page);
    if (consulta.size !== undefined) params = params.set('size', consulta.size);
    if (consulta.sort) params = params.set('sort', consulta.sort);

    return this.http
      .get<RespuestaApi<RespuestaPaginada<DocumentoAdministracionDto>>>(ENDPOINTS_API.administracion.documentos, {
        params,
      })
      .pipe(map((respuesta) => this.extraerPagina(respuesta)));
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

  private extraerPagina(
    respuesta: RespuestaApi<RespuestaPaginada<DocumentoAdministracionDto>>,
  ): RespuestaPaginada<DocumentoAdministracion> {
    const pagina = respuesta.data;
    if (!pagina) throw new Error(respuesta.message ?? 'No se pudieron cargar los documentos.');

    return {
      ...pagina,
      contenido: pagina.contenido.map(mapearDocumentoAdministracion),
    };
  }
}

export interface ConsultaDocumentosAdministracion {
  readonly estado?: EstadoDocumentoAdministracion;
  readonly campoBusqueda?: 'TODOS' | 'NOMBRE' | 'CORREO' | 'DOCUMENTO';
  readonly busqueda?: string;
  readonly page?: number;
  readonly size?: 10 | 20 | 50;
  readonly sort?: 'fechaCreacion,asc' | 'fechaCreacion,desc' | 'numeroDocumento,asc' | 'numeroDocumento,desc';
}
