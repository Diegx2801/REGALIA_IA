import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi, RespuestaPaginada } from '../../../shared/modelos/respuesta-api.model';
import { mapearProductoDesdeDto } from '../mapeadores/producto.mapper';
import { OrdenCatalogo } from '../modelos/catalogo-ui.model';
import { ProductoPublicoDto } from '../modelos/producto.dto';
import { Producto } from '../modelos/producto.model';

const TIEMPO_ESPERA_CATALOGO_MS = 8000;
const TAMANIO_PAGINA_CATALOGO = 12;

export interface ConsultaProductosCatalogo {
  page?: number;
  size?: number;
  search?: string;
  idTipoProducto?: number | null;
  precioMaximo?: number | null;
  soloDisponibles?: boolean;
  orden?: OrdenCatalogo;
}

@Injectable({ providedIn: 'root' })
export class ProductoApiService {
  private readonly http = inject(HttpClient);

  obtenerProductos(
    consulta: ConsultaProductosCatalogo = {},
  ): Observable<RespuestaPaginada<Producto>> {
    let params = new HttpParams()
      .set('page', consulta.page ?? 0)
      .set('size', consulta.size ?? TAMANIO_PAGINA_CATALOGO)
      .set('soloDisponibles', consulta.soloDisponibles ?? true)
      .set('sort', this.mapearOrden(consulta.orden ?? 'recommended'));

    if (consulta.search?.trim()) {
      params = params.set('search', consulta.search.trim());
    }

    if (consulta.idTipoProducto) {
      params = params.set('idTipoProducto', consulta.idTipoProducto);
    }

    if (consulta.precioMaximo !== null && consulta.precioMaximo !== undefined) {
      params = params.set('precioMaximo', consulta.precioMaximo);
    }

    return this.http
      .get<RespuestaApi<RespuestaPaginada<ProductoPublicoDto>>>(ENDPOINTS_API.catalogo.productos, {
        params,
      })
      .pipe(
        timeout(TIEMPO_ESPERA_CATALOGO_MS),
        map((respuesta) => this.mapearPagina(respuesta, consulta.size ?? TAMANIO_PAGINA_CATALOGO)),
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

  obtenerProductosPorTienda(idTienda: number): Observable<Producto[]> {
    return this.http
      .get<RespuestaApi<ProductoPublicoDto[]>>(ENDPOINTS_API.tiendas.productos(idTienda))
      .pipe(
        timeout(TIEMPO_ESPERA_CATALOGO_MS),
        map((respuesta) => (respuesta.data ?? []).map(mapearProductoDesdeDto)),
      );
  }

  private mapearOrden(orden: OrdenCatalogo): string {
    if (orden === 'priceAsc') return 'precio,asc';
    if (orden === 'priceDesc') return 'precio,desc';
    return 'recomendado,asc';
  }

  private mapearPagina(
    respuesta: RespuestaApi<RespuestaPaginada<ProductoPublicoDto>>,
    tamanioPredeterminado: number,
  ): RespuestaPaginada<Producto> {
    const pagina = respuesta.data;

    if (!pagina) {
      return {
        contenido: [],
        paginaActual: 0,
        tamanioPagina: tamanioPredeterminado,
        totalElementos: 0,
        totalPaginas: 0,
        ultimaPagina: true,
      };
    }

    return {
      ...pagina,
      contenido: pagina.contenido.map(mapearProductoDesdeDto),
    };
  }
}
