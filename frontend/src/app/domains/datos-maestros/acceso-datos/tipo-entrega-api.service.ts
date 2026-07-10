import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi } from '../../../shared/modelos/respuesta-api.model';
import { mapearTipoEntregaDesdeDto } from '../mapeadores/tipo-entrega.mapper';
import { TipoEntregaDto } from '../modelos/tipo-entrega.dto';
import { TipoEntrega } from '../modelos/tipo-entrega.model';

const TIEMPO_ESPERA_DATOS_MAESTROS_MS = 8000;

@Injectable({ providedIn: 'root' })
export class TipoEntregaApiService {
  private readonly http = inject(HttpClient);

  obtenerTiposEntrega(): Observable<TipoEntrega[]> {
    return this.http
      .get<RespuestaApi<TipoEntregaDto[]>>(ENDPOINTS_API.datosMaestros.tiposEntrega)
      .pipe(
        timeout(TIEMPO_ESPERA_DATOS_MAESTROS_MS),
        map((respuesta) => (respuesta.data ?? []).map(mapearTipoEntregaDesdeDto)),
      );
  }
}
