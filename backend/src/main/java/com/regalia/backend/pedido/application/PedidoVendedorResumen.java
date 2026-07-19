package com.regalia.backend.pedido.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Proyeccion ligera para la bandeja paginada de pedidos del vendedor. */
public record PedidoVendedorResumen(
        Long idPedido,
        Long idCliente,
        String correoCliente,
        Long idTienda,
        String nombreTienda,
        LocalDate fechaEntrega,
        String estadoPedido,
        BigDecimal total,
        BigDecimal montoPagado,
        Long cantidadItems,
        LocalDateTime fechaCreacion
) {
}
