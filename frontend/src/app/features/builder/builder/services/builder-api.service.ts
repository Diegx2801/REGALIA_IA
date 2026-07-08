import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, timeout } from 'rxjs';
import { API_ENDPOINTS } from '../../../../core/config/api.config';
import {
  ApiResponse,
  BuilderIARecomendacionBackend,
  SolicitudBuilderIAConstructor,
} from '../models/builder.model';

@Injectable({ providedIn: 'root' })
export class BuilderApiService {
  private readonly http = inject(HttpClient);

  recomendarProductos(
    solicitud: SolicitudBuilderIAConstructor,
  ): Observable<BuilderIARecomendacionBackend> {
    return this.http
      .post<ApiResponse<BuilderIARecomendacionBackend>>(
        API_ENDPOINTS.builderIa.recommendations,
        solicitud,
      )
      .pipe(
        timeout(20000),
        map((response) => {
          if (response.status !== 'success' || !response.data) {
            throw new Error(response.message ?? 'No se pudieron obtener recomendaciones.');
          }

          return response.data;
        }),
      );
  }
}
