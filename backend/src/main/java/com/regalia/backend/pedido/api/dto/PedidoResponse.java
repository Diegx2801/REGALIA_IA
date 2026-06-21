package com.regalia.backend.pedido.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO de respuesta para pedidos.
 */
public record PedidoResponse(
        Long idPedido,
        Long idUsuario,
        Long idTienda,
        String nombreTienda,
        Long idTipoEntrega,
        String tipoEntrega,
        LocalDate fechaEntrega,
        String observacion,
        String estadoPedido,
        BigDecimal subtotal,
        BigDecimal total,
        BigDecimal montoPagado,
        BigDecimal saldoPendiente,
        Boolean estado,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion,
        List<PedidoDetalleResponse> detalles
) {
}