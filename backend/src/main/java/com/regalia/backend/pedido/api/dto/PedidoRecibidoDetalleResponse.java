package com.regalia.backend.pedido.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO detallado para que el vendedor consulte un pedido recibido
 * en una de sus tiendas.
 *
 * Incluye información del cliente, tienda, entrega, productos y pagos,
 * pero no permite modificar montos, comisiones ni datos financieros.
 */
public record PedidoRecibidoDetalleResponse(
        Long idPedido,
        Long idCliente,
        String correoCliente,
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
        List<PedidoRecibidoDetalleProductoResponse> detalles,
        List<PedidoRecibidoPagoResponse> pagos
) {}