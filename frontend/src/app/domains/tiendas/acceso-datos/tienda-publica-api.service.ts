import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi } from '../../../shared/modelos/respuesta-api.model';
import { mapearTiendaPublicaDesdeDto } from '../mapeadores/tienda-publica.mapper';
import { TiendaPublicaDto } from '../modelos/tienda-publica.dto';
import { TiendaPublica } from '../modelos/tienda-publica.model';

const TIEMPO_ESPERA_TIENDAS_MS = 8000;

@Injectable({ providedIn: 'root' })
export class TiendaPublicaApiService {
  private readonly http = inject(HttpClient);

  obtenerTiendasPublicas(): Observable<TiendaPublica[]> {
    return this.http.get<RespuestaApi<TiendaPublicaDto[]>>(ENDPOINTS_API.tiendas.publicas).pipe(
      timeout(TIEMPO_ESPERA_TIENDAS_MS),
      map((respuesta) => (respuesta.data ?? []).map(mapearTiendaPublicaDesdeDto)),
    );
  }
}
