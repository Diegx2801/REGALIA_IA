import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi, RespuestaPaginada } from '../../../shared/modelos/respuesta-api.model';
import {
  mapearPedidoAdministracionDesdeDto,
  mapearTiendaAdministracionDesdeDto,
  mapearUsuarioAdministracionDesdeDto,
  mapearVendedorAdministracionDesdeDto,
} from '../mapeadores/panel-administracion.mapper';
import {
  PedidoAdministracionDto,
  TiendaAdministracionDto,
  UsuarioAdministracionDto,
  VendedorAdministracionDto,
} from '../modelos/panel-administracion.dto';
import {
  PedidoAdministracion,
  TiendaAdministracion,
  UsuarioAdministracion,
  VendedorAdministracion,
} from '../modelos/panel-administracion.model';

const TIEMPO_ESPERA_ADMIN_MS = 10000;

export interface ConsultaUsuariosAdmin {
  page?: number;
  size?: number;
  estado?: 'ACTIVO' | 'INACTIVO' | 'TODOS';
  search?: string;
}

export interface ConsultaTiendasAdmin {
  page?: number;
  size?: number;
  estadoRevision?: string;
  search?: string;
}

export interface ConsultaPedidosAdmin {
  page?: number;
  size?: number;
  estadoPago?: string;
  search?: string;
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
      .set('sort', 'idUsuario,desc')
      .set('estado', consulta.estado ?? 'ACTIVO');

    if (consulta.search?.trim()) {
      params = params.set('searchField', 'correo').set('search', consulta.search.trim());
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

  obtenerVendedores(size = 5): Observable<RespuestaPaginada<VendedorAdministracion>> {
    const params = new HttpParams().set('page', 0).set('size', size).set('sort', 'fechaCreacion,desc');

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

  obtenerTiendas(
    consulta: ConsultaTiendasAdmin = {},
  ): Observable<RespuestaPaginada<TiendaAdministracion>> {
    let params = new HttpParams()
      .set('page', consulta.page ?? 0)
      .set('size', consulta.size ?? 6)
      .set('sort', 'idTienda,desc');

    if (consulta.estadoRevision) {
      params = params.set('estadoRevision', consulta.estadoRevision);
    }

    if (consulta.search?.trim()) {
      params = params.set('searchField', 'nombre').set('search', consulta.search.trim());
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

  obtenerPedidos(
    consulta: ConsultaPedidosAdmin = {},
  ): Observable<RespuestaPaginada<PedidoAdministracion>> {
    let params = new HttpParams()
      .set('page', consulta.page ?? 0)
      .set('size', consulta.size ?? 6)
      .set('sort', 'fechaCreacion,desc');

    if (consulta.estadoPago) {
      params = params.set('estadoPago', consulta.estadoPago);
    }

    if (consulta.search?.trim()) {
      params = params.set('searchField', 'nombreTienda').set('search', consulta.search.trim());
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

  aprobarTienda(idTienda: number): Observable<TiendaAdministracion> {
    return this.cambiarEstadoRevisionTienda(idTienda, 'aprobar');
  }

  observarTienda(idTienda: number): Observable<TiendaAdministracion> {
    return this.cambiarEstadoRevisionTienda(idTienda, 'observar');
  }

  rechazarTienda(idTienda: number): Observable<TiendaAdministracion> {
    return this.cambiarEstadoRevisionTienda(idTienda, 'rechazar');
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
          if (!respuesta.data) throw new Error(respuesta.message ?? 'No se pudo actualizar la tienda.');
          return mapearTiendaAdministracionDesdeDto(respuesta.data);
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
