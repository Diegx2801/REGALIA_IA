package com.regalia.backend.pedido.api.dto;

import java.math.BigDecimal;

/**
 * DTO de respuesta para los productos de un pedido.
 */
public record PedidoDetalleResponse(
        Long idDetallePedido,
        Long idProducto,
        String nombreProducto,
        Integer cantidad,
        BigDecimal precioUnitario,
        BigDecimal subtotal
) {
}