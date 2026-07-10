import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi } from '../../../shared/modelos/respuesta-api.model';
import {
  mapearOpcionPagoInicialDesdeDto,
  mapearResultadoCheckoutDesdeDto,
  mapearSolicitudCheckoutADto,
} from '../mapeadores/checkout.mapper';
import { CheckoutSessionResponseDto, OpcionPagoInicialDto } from '../modelos/checkout.dto';
import { OpcionPagoInicial, ResultadoCheckout, SolicitudCheckout } from '../modelos/checkout.model';

const TIEMPO_ESPERA_CHECKOUT_MS = 10000;

@Injectable({ providedIn: 'root' })
export class CheckoutApiService {
  private readonly http = inject(HttpClient);

  obtenerOpcionesPagoInicial(): Observable<OpcionPagoInicial[]> {
    return this.http
      .get<RespuestaApi<OpcionPagoInicialDto[]>>(ENDPOINTS_API.pedidos.opcionesPagoInicial)
      .pipe(
        timeout(TIEMPO_ESPERA_CHECKOUT_MS),
        map((respuesta) => (respuesta.data ?? []).map(mapearOpcionPagoInicialDesdeDto)),
      );
  }

  crearSesionCheckout(solicitud: SolicitudCheckout): Observable<ResultadoCheckout> {
    return this.http
      .post<RespuestaApi<CheckoutSessionResponseDto>>(
        ENDPOINTS_API.checkout.sesiones,
        mapearSolicitudCheckoutADto(solicitud),
      )
      .pipe(
        timeout(TIEMPO_ESPERA_CHECKOUT_MS),
        map((respuesta) => {
          if (!respuesta.data) throw new Error(respuesta.message ?? 'No se pudo preparar el checkout.');
          return mapearResultadoCheckoutDesdeDto(respuesta.data);
        }),
      );
  }
}
