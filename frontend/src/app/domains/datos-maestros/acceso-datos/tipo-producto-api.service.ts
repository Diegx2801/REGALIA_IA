import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi } from '../../../shared/modelos/respuesta-api.model';
import { mapearTipoProductoDesdeDto } from '../mapeadores/tipo-producto.mapper';
import { TipoProductoDto } from '../modelos/tipo-producto.dto';
import { TipoProducto } from '../modelos/tipo-producto.model';

const TIEMPO_ESPERA_TIPOS_PRODUCTO_MS = 8000;

@Injectable({ providedIn: 'root' })
export class TipoProductoApiService {
  private readonly http = inject(HttpClient);

  obtenerTiposProducto(): Observable<TipoProducto[]> {
    return this.http.get<RespuestaApi<TipoProductoDto[]>>(ENDPOINTS_API.catalogo.tiposProducto).pipe(
      timeout(TIEMPO_ESPERA_TIPOS_PRODUCTO_MS),
      map((respuesta) => (respuesta.data ?? []).map(mapearTipoProductoDesdeDto)),
    );
  }
}
