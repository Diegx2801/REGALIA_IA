package com.regalia.backend.pedido.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO de resumen para mostrar al vendedor los pedidos recibidos
 * en sus tiendas.
 *
 * Esta respuesta está pensada para la bandeja principal de ventas
 * del vendedor, por eso no incluye todo el detalle de productos ni pagos.
 */
public record PedidoRecibidoResumenResponse(
        Long idPedido,
        Long idCliente,
        String correoCliente,
        Long idTienda,
        String nombreTienda,
        LocalDate fechaEntrega,
        String estadoPedido,
        BigDecimal total,
        BigDecimal montoPagado,
        BigDecimal saldoPendiente,
        Integer cantidadItems,
        LocalDateTime fechaCreacion
) {}