import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi } from '../../../shared/modelos/respuesta-api.model';
import { mapearRubroDesdeDto } from '../mapeadores/rubro.mapper';
import { RubroDto } from '../modelos/rubro.dto';
import { Rubro } from '../modelos/rubro.model';

const TIEMPO_ESPERA_RUBROS_MS = 8000;

@Injectable({ providedIn: 'root' })
export class RubroApiService {
  private readonly http = inject(HttpClient);

  obtenerRubros(): Observable<Rubro[]> {
    return this.http.get<RespuestaApi<RubroDto[]>>(ENDPOINTS_API.catalogo.rubros).pipe(
      timeout(TIEMPO_ESPERA_RUBROS_MS),
      map((respuesta) => (respuesta.data ?? []).map(mapearRubroDesdeDto)),
    );
  }
}
