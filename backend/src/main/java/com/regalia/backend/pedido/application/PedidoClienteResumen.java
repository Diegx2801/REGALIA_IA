package com.regalia.backend.pedido.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Proyeccion de lectura para el historial paginado de pedidos del cliente.
 */
public record PedidoClienteResumen(
        Long idPedido,
        String nombreTienda,
        String tipoEntrega,
        LocalDate fechaEntrega,
        String estadoPedido,
        BigDecimal total,
        BigDecimal montoPagado,
        LocalDateTime fechaCreacion
) {
}
