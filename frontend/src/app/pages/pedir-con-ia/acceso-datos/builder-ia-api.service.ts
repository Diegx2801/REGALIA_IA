import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi } from '../../../shared/modelos/respuesta-api.model';
import {
  mapearResultadoRecomendacionIaDesdeDto,
  mapearSolicitudRecomendacionIaADto,
} from '../mapeadores/builder-ia.mapper';
import { BuilderIaRecomendacionResponseDto } from '../modelos/builder-ia.dto';
import { ResultadoRecomendacionIa, SolicitudRecomendacionIa } from '../modelos/builder-ia.model';

const TIEMPO_ESPERA_IA_MS = 15000;

@Injectable({ providedIn: 'root' })
export class BuilderIaApiService {
  private readonly http = inject(HttpClient);

  recomendarProductos(solicitud: SolicitudRecomendacionIa): Observable<ResultadoRecomendacionIa> {
    return this.http
      .post<RespuestaApi<BuilderIaRecomendacionResponseDto>>(
        ENDPOINTS_API.ia.recomendarProductos,
        mapearSolicitudRecomendacionIaADto(solicitud),
      )
      .pipe(
        timeout(TIEMPO_ESPERA_IA_MS),
        map((respuesta) => {
          if (!respuesta.data) {
            throw new Error(respuesta.message ?? 'No se pudo obtener recomendaciones IA.');
          }

          return mapearResultadoRecomendacionIaDesdeDto(respuesta.data);
        }),
      );
  }
}
