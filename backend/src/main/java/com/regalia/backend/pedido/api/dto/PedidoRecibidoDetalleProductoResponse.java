package com.regalia.backend.pedido.api.dto;

import java.math.BigDecimal;

/**
 * DTO que representa un producto incluido dentro de un pedido recibido
 * por una tienda del vendedor autenticado.
 *
 * Mantiene el precio unitario como snapshot del pedido, no como precio
 * actual del producto.
 */
public record PedidoRecibidoDetalleProductoResponse(
        Long idDetallePedido,
        Long idProducto,
        String nombreProducto,
        Integer cantidad,
        BigDecimal precioUnitario,
        BigDecimal subtotal
) {}