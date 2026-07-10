import {
  CheckoutSessionRequestDto,
  CheckoutSessionResponseDto,
  OpcionPagoInicialDto,
} from '../modelos/checkout.dto';
import { OpcionPagoInicial, ResultadoCheckout, SolicitudCheckout } from '../modelos/checkout.model';

export function mapearSolicitudCheckoutADto(
  solicitud: SolicitudCheckout,
): CheckoutSessionRequestDto {
  return {
    provider: solicitud.proveedor,
    idTienda: solicitud.idTienda,
    idTipoEntrega: solicitud.idTipoEntrega,
    codigoTipoPago: solicitud.codigoTipoPago,
    fechaEntrega: solicitud.fechaEntrega,
    observacion: solicitud.observacion,
    items: solicitud.items.map((item) => ({
      idProducto: item.idProducto,
      cantidad: item.cantidad,
    })),
  };
}

export function mapearResultadoCheckoutDesdeDto(
  dto: CheckoutSessionResponseDto,
): ResultadoCheckout {
  return {
    proveedor: dto.provider,
    referenciaExterna: dto.externalReference,
    monto: Number(dto.amount ?? 0),
    moneda: dto.currency || 'PEN',
    urlRedireccion: dto.redirectUrl || dto.initPoint || dto.sandboxInitPoint,
  };
}

export function mapearOpcionPagoInicialDesdeDto(dto: OpcionPagoInicialDto): OpcionPagoInicial {
  return {
    codigo: dto.codigo,
    nombre: dto.nombre,
    descripcion: dto.descripcion,
  };
}
