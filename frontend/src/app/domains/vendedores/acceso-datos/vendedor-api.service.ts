import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi, RespuestaPaginada } from '../../../shared/modelos/respuesta-api.model';
import {
  mapearPedidoRecibidoDetalleDesdeDto,
  mapearPedidoRecibidoDesdeDto,
  mapearPerfilVendedorDesdeDto,
  mapearProductoVendedorDesdeDto,
  mapearSolicitudProductoADto,
  mapearSolicitudTiendaADto,
  mapearTiendaVendedorDesdeDto,
} from '../mapeadores/vendedor.mapper';
import {
  PedidoRecibidoDetalleDto,
  PedidoRecibidoResumenDto,
  ProductoVendedorDto,
  TiendaVendedorDto,
  VendedorPerfilDto,
} from '../modelos/vendedor.dto';
import {
  PedidoRecibidoDetalle,
  PedidoRecibidoResumen,
  ProductoVendedor,
  SolicitudProductoVendedor,
  SolicitudTiendaVendedor,
  TiendaVendedor,
  VendedorPerfil,
} from '../modelos/vendedor.model';

const TIEMPO_ESPERA_VENDEDOR_MS = 10000;

export interface ConsultaPedidosVendedor {
  page?: number;
  size?: number;
  idTienda?: number;
  q?: string;
  estado?: string;
  estadoPago?: 'PAGADO' | 'CON_SALDO';
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class VendedorApiService {
  private readonly http = inject(HttpClient);

  obtenerPerfilActual(): Observable<VendedorPerfil> {
    return this.http.get<RespuestaApi<VendedorPerfilDto>>(ENDPOINTS_API.vendedores.perfilActual).pipe(
      timeout(TIEMPO_ESPERA_VENDEDOR_MS),
      map((respuesta) => {
        if (!respuesta.data) throw new Error(respuesta.message ?? 'No se pudo cargar el perfil vendedor.');
        return mapearPerfilVendedorDesdeDto(respuesta.data);
      }),
    );
  }

  crearPerfilVendedor(): Observable<VendedorPerfil> {
    return this.http.post<RespuestaApi<VendedorPerfilDto>>(ENDPOINTS_API.vendedores.perfilActual, {}).pipe(
      timeout(TIEMPO_ESPERA_VENDEDOR_MS),
      map((respuesta) => {
        if (!respuesta.data) throw new Error(respuesta.message ?? 'No se pudo crear el perfil vendedor.');
        return mapearPerfilVendedorDesdeDto(respuesta.data);
      }),
    );
  }

  obtenerTiendas(): Observable<TiendaVendedor[]> {
    return this.http.get<RespuestaApi<TiendaVendedorDto[]>>(ENDPOINTS_API.vendedores.tiendas).pipe(
      timeout(TIEMPO_ESPERA_VENDEDOR_MS),
      map((respuesta) => (respuesta.data ?? []).map(mapearTiendaVendedorDesdeDto)),
    );
  }

  crearTienda(solicitud: SolicitudTiendaVendedor): Observable<TiendaVendedor> {
    return this.http
      .post<RespuestaApi<TiendaVendedorDto>>(
        ENDPOINTS_API.vendedores.tiendas,
        mapearSolicitudTiendaADto(solicitud),
      )
      .pipe(
        timeout(TIEMPO_ESPERA_VENDEDOR_MS),
        map((respuesta) => {
          if (!respuesta.data) throw new Error(respuesta.message ?? 'No se pudo crear la tienda.');
          return mapearTiendaVendedorDesdeDto(respuesta.data);
        }),
      );
  }

  obtenerProductosPorTienda(idTienda: number): Observable<ProductoVendedor[]> {
    return this.http
      .get<RespuestaApi<ProductoVendedorDto[]>>(ENDPOINTS_API.vendedores.productosPorTienda(idTienda))
      .pipe(
        timeout(TIEMPO_ESPERA_VENDEDOR_MS),
        map((respuesta) => (respuesta.data ?? []).map(mapearProductoVendedorDesdeDto)),
      );
  }

  crearProducto(idTienda: number, solicitud: SolicitudProductoVendedor): Observable<ProductoVendedor> {
    return this.http
      .post<RespuestaApi<ProductoVendedorDto>>(
        ENDPOINTS_API.vendedores.productosPorTienda(idTienda),
        mapearSolicitudProductoADto(solicitud),
      )
      .pipe(
        timeout(TIEMPO_ESPERA_VENDEDOR_MS),
        map((respuesta) => {
          if (!respuesta.data) throw new Error(respuesta.message ?? 'No se pudo crear el producto.');
          return mapearProductoVendedorDesdeDto(respuesta.data);
        }),
      );
  }

  actualizarProducto(
    idTienda: number,
    idProducto: number,
    solicitud: SolicitudProductoVendedor,
  ): Observable<ProductoVendedor> {
    return this.http
      .put<RespuestaApi<ProductoVendedorDto>>(
        `${ENDPOINTS_API.vendedores.productosPorTienda(idTienda)}/${idProducto}`,
        mapearSolicitudProductoADto(solicitud),
      )
      .pipe(
        timeout(TIEMPO_ESPERA_VENDEDOR_MS),
        map((respuesta) => {
          if (!respuesta.data) throw new Error(respuesta.message ?? 'No se pudo actualizar el producto.');
          return mapearProductoVendedorDesdeDto(respuesta.data);
        }),
      );
  }

  desactivarProducto(idTienda: number, idProducto: number): Observable<void> {
    return this.http
      .delete<RespuestaApi<void>>(`${ENDPOINTS_API.vendedores.productosPorTienda(idTienda)}/${idProducto}`)
      .pipe(
        timeout(TIEMPO_ESPERA_VENDEDOR_MS),
        map(() => undefined),
      );
  }

  obtenerPedidosRecibidos(
    consulta: ConsultaPedidosVendedor = {},
  ): Observable<RespuestaPaginada<PedidoRecibidoResumen>> {
    let params = new HttpParams()
      .set('page', consulta.page ?? 0)
      .set('size', consulta.size ?? 10)
      .set('sort', consulta.sort ?? 'fechaCreacion,desc');

    if (consulta.idTienda !== undefined) params = params.set('idTienda', consulta.idTienda);
    if (consulta.q?.trim()) params = params.set('q', consulta.q.trim());
    if (consulta.estado) params = params.set('estado', consulta.estado);
    if (consulta.estadoPago) params = params.set('estadoPago', consulta.estadoPago);

    return this.http
      .get<RespuestaApi<RespuestaPaginada<PedidoRecibidoResumenDto>>>(
        ENDPOINTS_API.vendedores.pedidosRecibidos,
        { params },
      )
      .pipe(
        timeout(TIEMPO_ESPERA_VENDEDOR_MS),
        map((respuesta) => {
          const pagina = respuesta.data;
          if (!pagina) throw new Error(respuesta.message ?? 'No se pudieron cargar los pedidos recibidos.');

          return {
            ...pagina,
            contenido: pagina.contenido.map(mapearPedidoRecibidoDesdeDto),
          };
        }),
      );
  }

  obtenerDetallePedidoRecibido(idPedido: number): Observable<PedidoRecibidoDetalle> {
    return this.http
      .get<RespuestaApi<PedidoRecibidoDetalleDto>>(ENDPOINTS_API.vendedores.pedidoRecibidoPorId(idPedido))
      .pipe(
        timeout(TIEMPO_ESPERA_VENDEDOR_MS),
        map((respuesta) => {
          if (!respuesta.data) throw new Error(respuesta.message ?? 'No se pudo cargar el detalle del pedido.');
          return mapearPedidoRecibidoDetalleDesdeDto(respuesta.data);
        }),
      );
  }
}
