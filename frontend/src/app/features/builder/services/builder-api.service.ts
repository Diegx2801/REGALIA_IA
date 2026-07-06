import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, timeout } from 'rxjs';
import {
  ApiResponse,
  BuilderIARecomendacionBackend,
  SolicitudBuilderIAConstructor,
} from '../models/builder.model';

@Injectable({ providedIn: 'root' })
export class BuilderApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/builder-ia';

  recomendarProductos(
    solicitud: SolicitudBuilderIAConstructor,
  ): Observable<BuilderIARecomendacionBackend> {
    return this.http
      .post<ApiResponse<BuilderIARecomendacionBackend>>(
        `${this.endpoint}/recomendar-productos`,
        solicitud,
      )
      .pipe(
        timeout(20000),
        map((response) => response.data),
      );
  }
}
