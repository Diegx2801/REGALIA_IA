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

export type EstadoPedidoFiltroVendedor =
  'RESERVADO' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO' | 'ANULADO';

export type EstadoPagoFiltroVendedor = 'PAGADO' | 'CON_SALDO';

export type OrdenPedidosVendedor =
  | 'fechaCreacion,desc'
  | 'fechaEntrega,asc'
  | 'nombreTienda,asc'
  | 'total,desc'
  | 'saldoPendiente,desc';

export interface ConsultaPedidosVendedor {
  page?: number;
  size?: number;
  idTienda?: number;
  q?: string;
  estado?: EstadoPedidoFiltroVendedor;
  estadoPago?: EstadoPagoFiltroVendedor;
  sort?: OrdenPedidosVendedor;
}

@Injectable({ providedIn: 'root' })
export class VendedorApiService {
  private readonly http = inject(HttpClient);

  obtenerPerfilActual(): Observable<VendedorPerfil> {
    return this.http
      .get<RespuestaApi<VendedorPerfilDto>>(ENDPOINTS_API.vendedores.perfilActual)
      .pipe(
        timeout(TIEMPO_ESPERA_VENDEDOR_MS),
        map((respuesta) => {
          if (!respuesta.data)
            throw new Error(respuesta.message ?? 'No se pudo cargar el perfil vendedor.');
          return mapearPerfilVendedorDesdeDto(respuesta.data);
        }),
      );
  }

  crearPerfilVendedor(): Observable<VendedorPerfil> {
    return this.http
      .post<RespuestaApi<VendedorPerfilDto>>(ENDPOINTS_API.vendedores.perfilActual, {})
      .pipe(
        timeout(TIEMPO_ESPERA_VENDEDOR_MS),
        map((respuesta) => {
          if (!respuesta.data)
            throw new Error(respuesta.message ?? 'No se pudo crear el perfil vendedor.');
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
      .get<RespuestaApi<ProductoVendedorDto[]>>(
        ENDPOINTS_API.vendedores.productosPorTienda(idTienda),
      )
      .pipe(
        timeout(TIEMPO_ESPERA_VENDEDOR_MS),
        map((respuesta) => (respuesta.data ?? []).map(mapearProductoVendedorDesdeDto)),
      );
  }

  crearProducto(
    idTienda: number,
    solicitud: SolicitudProductoVendedor,
  ): Observable<ProductoVendedor> {
    return this.http
      .post<RespuestaApi<ProductoVendedorDto>>(
        ENDPOINTS_API.vendedores.productosPorTienda(idTienda),
        mapearSolicitudProductoADto(solicitud),
      )
      .pipe(
        timeout(TIEMPO_ESPERA_VENDEDOR_MS),
        map((respuesta) => {
          if (!respuesta.data)
            throw new Error(respuesta.message ?? 'No se pudo crear el producto.');
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
          if (!respuesta.data)
            throw new Error(respuesta.message ?? 'No se pudo actualizar el producto.');
          return mapearProductoVendedorDesdeDto(respuesta.data);
        }),
      );
  }

  desactivarProducto(idTienda: number, idProducto: number): Observable<void> {
    return this.http
      .delete<RespuestaApi<void>>(
        `${ENDPOINTS_API.vendedores.productosPorTienda(idTienda)}/${idProducto}`,
      )
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

    if (consulta.q?.trim()) params = params.set('q', consulta.q.trim());
    if (consulta.estado) params = params.set('estado', consulta.estado);
    if (consulta.estadoPago) params = params.set('estadoPago', consulta.estadoPago);

    const endpoint =
      consulta.idTienda === undefined
        ? ENDPOINTS_API.vendedores.pedidosRecibidos
        : ENDPOINTS_API.vendedores.pedidosPorTienda(consulta.idTienda);

    return this.http
      .get<RespuestaApi<RespuestaPaginada<PedidoRecibidoResumenDto>>>(endpoint, { params })
      .pipe(
        timeout(TIEMPO_ESPERA_VENDEDOR_MS),
        map((respuesta) => {
          const pagina = respuesta.data;
          if (!pagina)
            throw new Error(respuesta.message ?? 'No se pudieron cargar los pedidos recibidos.');

          return {
            ...pagina,
            contenido: pagina.contenido.map(mapearPedidoRecibidoDesdeDto),
          };
        }),
      );
  }

  obtenerProductoPorId(idTienda: number, idProducto: number): Observable<ProductoVendedor> {
    return this.http
      .get<RespuestaApi<ProductoVendedorDto>>(
        ENDPOINTS_API.vendedores.productoPorId(idTienda, idProducto),
      )
      .pipe(
        timeout(TIEMPO_ESPERA_VENDEDOR_MS),
        map((respuesta) => {
          if (!respuesta.data)
            throw new Error(respuesta.message ?? 'No se pudo cargar el producto.');
          return mapearProductoVendedorDesdeDto(respuesta.data);
        }),
      );
  }

  obtenerTiendaPorId(idTienda: number): Observable<TiendaVendedor> {
    return this.http
      .get<RespuestaApi<TiendaVendedorDto>>(ENDPOINTS_API.vendedores.tiendaPorId(idTienda))
      .pipe(
        timeout(TIEMPO_ESPERA_VENDEDOR_MS),
        map((respuesta) => {
          if (!respuesta.data) throw new Error(respuesta.message ?? 'No se pudo cargar la tienda.');
          return mapearTiendaVendedorDesdeDto(respuesta.data);
        }),
      );
  }

  actualizarTienda(
    idTienda: number,
    solicitud: SolicitudTiendaVendedor,
  ): Observable<TiendaVendedor> {
    return this.http
      .put<RespuestaApi<TiendaVendedorDto>>(
        ENDPOINTS_API.vendedores.tiendaPorId(idTienda),
        mapearSolicitudTiendaADto(solicitud),
      )
      .pipe(
        timeout(TIEMPO_ESPERA_VENDEDOR_MS),
        map((respuesta) => {
          if (!respuesta.data)
            throw new Error(respuesta.message ?? 'No se pudo actualizar la tienda.');
          return mapearTiendaVendedorDesdeDto(respuesta.data);
        }),
      );
  }

  eliminarTienda(idTienda: number): Observable<void> {
    return this.http
      .delete<RespuestaApi<void>>(ENDPOINTS_API.vendedores.tiendaPorId(idTienda))
      .pipe(
        timeout(TIEMPO_ESPERA_VENDEDOR_MS),
        map(() => undefined),
      );
  }

  obtenerDetallePedidoRecibido(idPedido: number): Observable<PedidoRecibidoDetalle> {
    return this.http
      .get<RespuestaApi<PedidoRecibidoDetalleDto>>(
        ENDPOINTS_API.vendedores.pedidoRecibidoPorId(idPedido),
      )
      .pipe(
        timeout(TIEMPO_ESPERA_VENDEDOR_MS),
        map((respuesta) => {
          if (!respuesta.data)
            throw new Error(respuesta.message ?? 'No se pudo cargar el detalle del pedido.');
          return mapearPedidoRecibidoDetalleDesdeDto(respuesta.data);
        }),
      );
  }
}
