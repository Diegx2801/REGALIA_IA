package com.regalia.backend.pedido.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO que representa un pago asociado a un pedido recibido.
 *
 * Para el vendedor se muestran datos de consulta, no de edición.
 * Los pagos son parte del historial financiero del pedido.
 */
public record PedidoRecibidoPagoResponse(
        Long idPago,
        String codigoTipoPago,
        String tipoPago,
        BigDecimal monto,
        String estadoPago,
        String metodoPagoPasarela,
        String codigoTransaccion,
        LocalDateTime fechaCreacion
) {}