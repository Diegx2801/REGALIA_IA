import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi, RespuestaPaginada } from '../../../shared/modelos/respuesta-api.model';
import {
  mapearPedidoAdministracionDesdeDto,
  mapearProductoCatalogoTiendaAdministracionDesdeDto,
  mapearTiendaAdministracionDesdeDto,
  mapearUsuarioAdministracionDesdeDto,
  mapearVendedorAdministracionDesdeDto,
} from '../mapeadores/panel-administracion.mapper';
import {
  PedidoAdministracionDto,
  ProductoCatalogoTiendaAdministracionDto,
  TiendaAdministracionDto,
  UsuarioAdministracionDto,
  VendedorAdministracionDto,
} from '../modelos/panel-administracion.dto';
import {
  PedidoAdministracion,
  ProductoCatalogoTiendaAdministracion,
  TiendaAdministracion,
  UsuarioAdministracion,
  VendedorAdministracion,
} from '../modelos/panel-administracion.model';

const TIEMPO_ESPERA_ADMIN_MS = 10000;

export interface ConsultaUsuariosAdmin {
  page?: number;
  size?: number;
  estado?: 'ACTIVO' | 'INACTIVO' | 'TODOS';
  searchField?: 'nombre' | 'correo' | 'telefono' | 'id_usuario';
  search?: string;
  sort?:
    | 'idUsuario,asc'
    | 'idUsuario,desc'
    | 'nombre,asc'
    | 'nombre,desc'
    | 'correo,asc'
    | 'correo,desc'
    | 'fechaCreacion,asc'
    | 'fechaCreacion,desc';
}

export interface ConsultaVendedoresAdmin {
  page?: number;
  size?: number;
  estado?: 'ACTIVO' | 'INACTIVO' | 'TODOS';
  verificacion?: 'VERIFICADO' | 'SIN_VERIFICAR' | 'TODOS';
  searchField?: 'nombre' | 'correo' | 'id_vendedor' | 'id_usuario';
  search?: string;
  sort?:
    | 'idVendedor,asc'
    | 'idVendedor,desc'
    | 'idUsuario,asc'
    | 'idUsuario,desc'
    | 'nombre,asc'
    | 'nombre,desc'
    | 'correo,asc'
    | 'correo,desc'
    | 'fechaCreacion,asc'
    | 'fechaCreacion,desc';
}

export interface ConsultaTiendasAdmin {
  page?: number;
  size?: number;
  estadoRevision?: 'PENDIENTE' | 'APROBADA' | 'OBSERVADA' | 'RECHAZADA';
  searchField?: 'nombre' | 'vendedor' | 'correo_vendedor' | 'id_tienda';
  search?: string;
  sort?:
    | 'idTienda,asc'
    | 'idTienda,desc'
    | 'nombre,asc'
    | 'nombre,desc'
    | 'estadoRevision,asc'
    | 'estadoRevision,desc'
    | 'nombreVendedor,asc'
    | 'nombreVendedor,desc'
    | 'fechaCreacion,asc'
    | 'fechaCreacion,desc';
}

export interface ConsultaPedidosAdmin {
  page?: number;
  size?: number;
  estadoPago?: 'PAGADO' | 'CON_SALDO';
  estadoPedido?: 'RESERVADO' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO' | 'ANULADO';
  idTienda?: number;
  searchField?: 'id_pedido' | 'nombre_tienda' | 'id_usuario';
  search?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  sort?:
    | 'idPedido,asc'
    | 'idPedido,desc'
    | 'fechaCreacion,asc'
    | 'fechaCreacion,desc'
    | 'fechaEntrega,asc'
    | 'fechaEntrega,desc'
    | 'nombreTienda,asc'
    | 'nombreTienda,desc'
    | 'total,asc'
    | 'total,desc'
    | 'saldoPendiente,asc'
    | 'saldoPendiente,desc';
}

@Injectable({ providedIn: 'root' })
export class PanelAdministracionApiService {
  private readonly http = inject(HttpClient);

  obtenerUsuarios(
    consulta: ConsultaUsuariosAdmin = {},
  ): Observable<RespuestaPaginada<UsuarioAdministracion>> {
    let params = new HttpParams()
      .set('page', consulta.page ?? 0)
      .set('size', consulta.size ?? 5)
      .set('sort', consulta.sort ?? 'idUsuario,desc')
      .set('estado', consulta.estado ?? 'ACTIVO');

    if (consulta.search?.trim()) {
      params = params
        .set('searchField', consulta.searchField ?? 'correo')
        .set('search', consulta.search.trim());
    }

    return this.http
      .get<RespuestaApi<RespuestaPaginada<UsuarioAdministracionDto>>>(
        ENDPOINTS_API.administracion.usuarios,
        { params },
      )
      .pipe(
        timeout(TIEMPO_ESPERA_ADMIN_MS),
        map((respuesta) => this.mapearPagina(respuesta, mapearUsuarioAdministracionDesdeDto)),
      );
  }

  obtenerVendedores(
    consulta: ConsultaVendedoresAdmin = {},
  ): Observable<RespuestaPaginada<VendedorAdministracion>> {
    let params = new HttpParams()
      .set('page', consulta.page ?? 0)
      .set('size', consulta.size ?? 5)
      .set('estado', consulta.estado ?? 'TODOS')
      .set('verificacion', consulta.verificacion ?? 'TODOS')
      .set('sort', consulta.sort ?? 'fechaCreacion,desc');

    if (consulta.search?.trim()) {
      params = params
        .set('searchField', consulta.searchField ?? 'nombre')
        .set('search', consulta.search.trim());
    }

    return this.http
      .get<RespuestaApi<RespuestaPaginada<VendedorAdministracionDto>>>(
        ENDPOINTS_API.administracion.vendedores,
        { params },
      )
      .pipe(
        timeout(TIEMPO_ESPERA_ADMIN_MS),
        map((respuesta) => this.mapearPagina(respuesta, mapearVendedorAdministracionDesdeDto)),
      );
  }

  obtenerUsuarioPorId(idUsuario: number): Observable<UsuarioAdministracion> {
    return this.obtenerDetalle(
      ENDPOINTS_API.administracion.usuarioPorId(idUsuario),
      mapearUsuarioAdministracionDesdeDto,
    );
  }

  obtenerVendedorPorId(idVendedor: number): Observable<VendedorAdministracion> {
    return this.obtenerDetalle(
      ENDPOINTS_API.administracion.vendedorPorId(idVendedor),
      mapearVendedorAdministracionDesdeDto,
    );
  }

  desactivarUsuario(idUsuario: number): Observable<UsuarioAdministracion> {
    return this.cambiarEstadoUsuario(idUsuario, 'desactivar');
  }

  reactivarUsuario(idUsuario: number): Observable<UsuarioAdministracion> {
    return this.cambiarEstadoUsuario(idUsuario, 'reactivar');
  }

  obtenerTiendas(
    consulta: ConsultaTiendasAdmin = {},
  ): Observable<RespuestaPaginada<TiendaAdministracion>> {
    let params = new HttpParams()
      .set('page', consulta.page ?? 0)
      .set('size', consulta.size ?? 6)
      .set('sort', consulta.sort ?? 'fechaCreacion,desc');

    if (consulta.estadoRevision) {
      params = params.set('estadoRevision', consulta.estadoRevision);
    }

    if (consulta.search?.trim()) {
      params = params
        .set('searchField', consulta.searchField ?? 'nombre')
        .set('search', consulta.search.trim());
    }

    return this.http
      .get<RespuestaApi<RespuestaPaginada<TiendaAdministracionDto>>>(
        ENDPOINTS_API.administracion.tiendas,
        { params },
      )
      .pipe(
        timeout(TIEMPO_ESPERA_ADMIN_MS),
        map((respuesta) => this.mapearPagina(respuesta, mapearTiendaAdministracionDesdeDto)),
      );
  }

  obtenerTiendaPorId(idTienda: number): Observable<TiendaAdministracion> {
    return this.obtenerDetalle(
      ENDPOINTS_API.administracion.tiendaPorId(idTienda),
      mapearTiendaAdministracionDesdeDto,
    );
  }

  obtenerCatalogoPublicoTienda(
    idTienda: number,
  ): Observable<ProductoCatalogoTiendaAdministracion[]> {
    return this.http
      .get<RespuestaApi<ProductoCatalogoTiendaAdministracionDto[]>>(
        ENDPOINTS_API.tiendas.productos(idTienda),
      )
      .pipe(
        timeout(TIEMPO_ESPERA_ADMIN_MS),
        map((respuesta) =>
          (respuesta.data ?? []).map(mapearProductoCatalogoTiendaAdministracionDesdeDto),
        ),
      );
  }

  obtenerPedidos(
    consulta: ConsultaPedidosAdmin = {},
  ): Observable<RespuestaPaginada<PedidoAdministracion>> {
    let params = new HttpParams()
      .set('page', consulta.page ?? 0)
      .set('size', consulta.size ?? 6)
      .set('sort', consulta.sort ?? 'fechaCreacion,desc');

    if (consulta.estadoPago) {
      params = params.set('estadoPago', consulta.estadoPago);
    }

    if (consulta.estadoPedido) {
      params = params.set('estadoPedido', consulta.estadoPedido);
    }

    if (consulta.idTienda) {
      params = params.set('idTienda', consulta.idTienda);
    }

    if (consulta.search?.trim()) {
      params = params
        .set('searchField', consulta.searchField ?? 'id_pedido')
        .set('search', consulta.search.trim());
    }

    if (consulta.fechaDesde) {
      params = params.set('fechaDesde', consulta.fechaDesde);
    }

    if (consulta.fechaHasta) {
      params = params.set('fechaHasta', consulta.fechaHasta);
    }

    return this.http
      .get<RespuestaApi<RespuestaPaginada<PedidoAdministracionDto>>>(
        ENDPOINTS_API.administracion.pedidos,
        { params },
      )
      .pipe(
        timeout(TIEMPO_ESPERA_ADMIN_MS),
        map((respuesta) => this.mapearPagina(respuesta, mapearPedidoAdministracionDesdeDto)),
      );
  }

  obtenerPedidoPorId(idPedido: number): Observable<PedidoAdministracion> {
    return this.obtenerDetalle(
      ENDPOINTS_API.administracion.pedidoPorId(idPedido),
      mapearPedidoAdministracionDesdeDto,
    );
  }

  aprobarTienda(idTienda: number): Observable<TiendaAdministracion> {
    return this.cambiarEstadoRevisionTienda(idTienda, 'aprobar');
  }

  observarTienda(idTienda: number): Observable<TiendaAdministracion> {
    return this.cambiarEstadoRevisionTienda(idTienda, 'observar');
  }

  rechazarTienda(idTienda: number): Observable<TiendaAdministracion> {
    return this.cambiarEstadoRevisionTienda(idTienda, 'rechazar');
  }

  private cambiarEstadoUsuario(
    idUsuario: number,
    accion: 'desactivar' | 'reactivar',
  ): Observable<UsuarioAdministracion> {
    const endpoint =
      accion === 'desactivar'
        ? ENDPOINTS_API.administracion.desactivarUsuario(idUsuario)
        : ENDPOINTS_API.administracion.reactivarUsuario(idUsuario);

    return this.http.patch<RespuestaApi<UsuarioAdministracionDto>>(endpoint, {}).pipe(
      timeout(TIEMPO_ESPERA_ADMIN_MS),
      map((respuesta) => {
        if (!respuesta.data) {
          throw new Error(respuesta.message ?? 'No se pudo actualizar el usuario.');
        }

        return mapearUsuarioAdministracionDesdeDto(respuesta.data);
      }),
    );
  }

  private cambiarEstadoRevisionTienda(
    idTienda: number,
    accion: 'aprobar' | 'observar' | 'rechazar',
  ): Observable<TiendaAdministracion> {
    return this.http
      .patch<RespuestaApi<TiendaAdministracionDto>>(
        `${ENDPOINTS_API.administracion.tiendas}/${idTienda}/${accion}`,
        {},
      )
      .pipe(
        timeout(TIEMPO_ESPERA_ADMIN_MS),
        map((respuesta) => {
          if (!respuesta.data)
            throw new Error(respuesta.message ?? 'No se pudo actualizar la tienda.');
          return mapearTiendaAdministracionDesdeDto(respuesta.data);
        }),
      );
  }

  private obtenerDetalle<TDto, TModelo>(
    endpoint: string,
    mapper: (dto: TDto) => TModelo,
  ): Observable<TModelo> {
    return this.http.get<RespuestaApi<TDto>>(endpoint).pipe(
      timeout(TIEMPO_ESPERA_ADMIN_MS),
      map((respuesta) => {
        if (!respuesta.data) {
          throw new Error(respuesta.message ?? 'No se pudo obtener el detalle solicitado.');
        }

        return mapper(respuesta.data);
      }),
    );
  }

  private mapearPagina<TDto, TModelo>(
    respuesta: RespuestaApi<RespuestaPaginada<TDto>>,
    mapper: (dto: TDto) => TModelo,
  ): RespuestaPaginada<TModelo> {
    const pagina = respuesta.data;
    if (!pagina) {
      return {
        contenido: [],
        paginaActual: 0,
        tamanioPagina: 0,
        totalElementos: 0,
        totalPaginas: 0,
        ultimaPagina: true,
      };
    }

    return {
      ...pagina,
      contenido: pagina.contenido.map(mapper),
    };
  }
}
