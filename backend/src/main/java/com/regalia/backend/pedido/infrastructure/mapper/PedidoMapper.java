package com.regalia.backend.pedido.infrastructure.mapper;

import com.regalia.backend.pedido.api.dto.OpcionPagoResponse;
import com.regalia.backend.pedido.api.dto.PedidoDetalleResponse;
import com.regalia.backend.pedido.api.dto.PedidoResponse;
import com.regalia.backend.pedido.infrastructure.entity.DetallePedidoEntity;
import com.regalia.backend.pedido.infrastructure.entity.PedidoEntity;
import com.regalia.backend.tipopago.infrastructure.entity.TipoPagoEntity;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Mapper para convertir entidades del módulo pedido a DTOs de respuesta.
 */
@Component
public class PedidoMapper {

    public PedidoResponse toResponse(
            PedidoEntity pedido,
            List<DetallePedidoEntity> detalles,
            BigDecimal montoPagado,
            BigDecimal saldoPendiente
    ) {
        return new PedidoResponse(
                pedido.getIdPedido(),
                pedido.getUsuario().getIdUsuario(),
                pedido.getTienda().getIdTienda(),
                pedido.getTienda().getNombre(),
                pedido.getTipoEntrega().getIdTipoEntrega(),
                pedido.getTipoEntrega().getNombre(),
                pedido.getFechaEntrega(),
                pedido.getObservacion(),
                pedido.getEstadoPedido(),
                pedido.getSubtotal(),
                pedido.getTotal(),
                montoPagado,
                saldoPendiente,
                pedido.getEstado(),
                pedido.getFechaCreacion(),
                pedido.getFechaActualizacion(),
                detalles.stream()
                        .map(this::toDetalleResponse)
                        .toList()
        );
    }

    public PedidoDetalleResponse toDetalleResponse(DetallePedidoEntity detalle) {
        BigDecimal subtotalDetalle = detalle.getPrecioUnitario()
                .multiply(BigDecimal.valueOf(detalle.getCantidad()));

        return new PedidoDetalleResponse(
                detalle.getIdDetallePedido(),
                detalle.getProducto().getIdProducto(),
                detalle.getProducto().getNombre(),
                detalle.getCantidad(),
                detalle.getPrecioUnitario(),
                subtotalDetalle
        );
    }

    public OpcionPagoResponse toOpcionPagoResponse(TipoPagoEntity tipoPago) {
        return new OpcionPagoResponse(
                tipoPago.getCodigo(),
                tipoPago.getNombre(),
                tipoPago.getDescripcion()
        );
    }
}