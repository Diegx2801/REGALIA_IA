import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi, RespuestaPaginada } from '../../../shared/modelos/respuesta-api.model';
import {
  mapearPedidoClienteDesdeDto,
  mapearPedidoClienteResumenDesdeDto,
} from '../mapeadores/pedido-cliente.mapper';
import { PedidoClienteDto, PedidoClienteResumenDto } from '../modelos/pedido-cliente.dto';
import { PedidoCliente, PedidoClienteResumen } from '../modelos/pedido-cliente.model';

const TIEMPO_ESPERA_PEDIDOS_CLIENTE_MS = 10000;

export interface ConsultaPedidosCliente {
  page?: number;
  size?: number;
  q?: string;
  estado?: string;
  estadoPago?: 'PAGADO' | 'CON_SALDO';
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class PedidoClienteApiService {
  private readonly http = inject(HttpClient);

  obtenerMisPedidos(
    consulta: ConsultaPedidosCliente = {},
  ): Observable<RespuestaPaginada<PedidoClienteResumen>> {
    let params = new HttpParams()
      .set('page', consulta.page ?? 0)
      .set('size', consulta.size ?? 10)
      .set('sort', consulta.sort ?? 'fechaCreacion,desc');

    if (consulta.q?.trim()) params = params.set('q', consulta.q.trim());
    if (consulta.estado) params = params.set('estado', consulta.estado);
    if (consulta.estadoPago) params = params.set('estadoPago', consulta.estadoPago);

    return this.http
      .get<RespuestaApi<RespuestaPaginada<PedidoClienteResumenDto>>>(
        ENDPOINTS_API.pedidos.propios,
        { params },
      )
      .pipe(
        timeout(TIEMPO_ESPERA_PEDIDOS_CLIENTE_MS),
        map((respuesta) => {
          const pagina = respuesta.data;
          if (!pagina) throw new Error(respuesta.message ?? 'No se pudieron cargar tus pedidos.');

          return {
            ...pagina,
            contenido: pagina.contenido.map(mapearPedidoClienteResumenDesdeDto),
          };
        }),
      );
  }

  obtenerMiPedidoPorId(idPedido: number): Observable<PedidoCliente> {
    return this.http
      .get<RespuestaApi<PedidoClienteDto>>(ENDPOINTS_API.pedidos.propioPorId(idPedido))
      .pipe(
        timeout(TIEMPO_ESPERA_PEDIDOS_CLIENTE_MS),
        map((respuesta) => {
          if (!respuesta.data) throw new Error(respuesta.message ?? 'No se pudo cargar el pedido.');
          return mapearPedidoClienteDesdeDto(respuesta.data);
        }),
      );
  }

  reenviarCodigoEntrega(idPedido: number): Observable<void> {
    return this.http
      .post<RespuestaApi<void>>(ENDPOINTS_API.pedidos.reenviarCodigoEntrega(idPedido), {})
      .pipe(timeout(TIEMPO_ESPERA_PEDIDOS_CLIENTE_MS), map(() => undefined));
  }
}
