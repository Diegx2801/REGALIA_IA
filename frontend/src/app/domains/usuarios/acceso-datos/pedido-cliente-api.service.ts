import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi } from '../../../shared/modelos/respuesta-api.model';
import { mapearPedidoClienteDesdeDto } from '../mapeadores/pedido-cliente.mapper';
import { PedidoClienteDto, RegistrarPagoPedidoRequestDto } from '../modelos/pedido-cliente.dto';
import { PedidoCliente, SolicitudRegistrarPagoPedido } from '../modelos/pedido-cliente.model';

const TIEMPO_ESPERA_PEDIDOS_CLIENTE_MS = 10000;

@Injectable({ providedIn: 'root' })
export class PedidoClienteApiService {
  private readonly http = inject(HttpClient);

  obtenerMisPedidos(): Observable<PedidoCliente[]> {
    return this.http.get<RespuestaApi<PedidoClienteDto[]>>(ENDPOINTS_API.pedidos.propios).pipe(
      timeout(TIEMPO_ESPERA_PEDIDOS_CLIENTE_MS),
      map((respuesta) => (respuesta.data ?? []).map(mapearPedidoClienteDesdeDto)),
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

  registrarPagoRestante(
    idPedido: number,
    solicitud: SolicitudRegistrarPagoPedido,
  ): Observable<PedidoCliente> {
    const cuerpo: RegistrarPagoPedidoRequestDto = {
      metodoPagoPasarela: solicitud.metodoPagoPasarela,
      codigoTransaccion: solicitud.codigoTransaccion,
    };

    return this.http
      .post<RespuestaApi<PedidoClienteDto>>(ENDPOINTS_API.pedidos.registrarPago(idPedido), cuerpo)
      .pipe(
        timeout(TIEMPO_ESPERA_PEDIDOS_CLIENTE_MS),
        map((respuesta) => {
          if (!respuesta.data) throw new Error(respuesta.message ?? 'No se pudo registrar el pago.');
          return mapearPedidoClienteDesdeDto(respuesta.data);
        }),
      );
  }
}
