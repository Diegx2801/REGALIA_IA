import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi } from '../../../shared/modelos/respuesta-api.model';
import { mapearTipoDocumentoDesdeDto } from '../mapeadores/tipo-documento.mapper';
import { TipoDocumentoDto } from '../modelos/tipo-documento.dto';
import { TipoDocumento } from '../modelos/tipo-documento.model';

const TIEMPO_ESPERA_TIPOS_DOCUMENTO_MS = 8000;

@Injectable({ providedIn: 'root' })
export class TipoDocumentoApiService {
  private readonly http = inject(HttpClient);

  obtenerTiposDocumento(): Observable<TipoDocumento[]> {
    return this.http
      .get<RespuestaApi<TipoDocumentoDto[]>>(ENDPOINTS_API.datosMaestros.tiposDocumento)
      .pipe(
        timeout(TIEMPO_ESPERA_TIPOS_DOCUMENTO_MS),
        map((respuesta) => (respuesta.data ?? []).map(mapearTipoDocumentoDesdeDto)),
      );
  }
}
