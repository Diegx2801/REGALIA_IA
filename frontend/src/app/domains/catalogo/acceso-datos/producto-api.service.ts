import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi } from '../../../shared/modelos/respuesta-api.model';
import { mapearProductoDesdeDto } from '../mapeadores/producto.mapper';
import { ProductoPublicoDto } from '../modelos/producto.dto';
import { Producto } from '../modelos/producto.model';

const TIEMPO_ESPERA_CATALOGO_MS = 8000;

@Injectable({ providedIn: 'root' })
export class ProductoApiService {
  private readonly http = inject(HttpClient);

  obtenerProductos(): Observable<Producto[]> {
    return this.http.get<RespuestaApi<ProductoPublicoDto[]>>(ENDPOINTS_API.catalogo.productos).pipe(
      timeout(TIEMPO_ESPERA_CATALOGO_MS),
      map((respuesta) => (respuesta.data ?? []).map(mapearProductoDesdeDto)),
    );
  }

  obtenerProductoPorId(idProducto: number): Observable<Producto> {
    return this.http
      .get<RespuestaApi<ProductoPublicoDto>>(ENDPOINTS_API.catalogo.productoPorId(idProducto))
      .pipe(
        timeout(TIEMPO_ESPERA_CATALOGO_MS),
        map((respuesta) => {
          if (!respuesta.data) throw new Error(respuesta.message ?? 'Producto no encontrado.');
          return mapearProductoDesdeDto(respuesta.data);
        }),
      );
  }
}
