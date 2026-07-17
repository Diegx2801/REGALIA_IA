package com.regalia.backend.pedido.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Vista ligera de un pedido para el historial del cliente.
 *
 * Los productos y observaciones se consultan solo al abrir el detalle para
 * mantener el listado paginado eficiente.
 */
public record PedidoClienteResumenResponse(
        Long idPedido,
        String nombreTienda,
        String tipoEntrega,
        LocalDate fechaEntrega,
        String estadoPedido,
        BigDecimal total,
        BigDecimal montoPagado,
        BigDecimal saldoPendiente,
        LocalDateTime fechaCreacion
) {
}
