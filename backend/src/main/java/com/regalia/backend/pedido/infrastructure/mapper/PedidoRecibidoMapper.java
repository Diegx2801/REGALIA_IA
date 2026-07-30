package com.regalia.backend.pedido.infrastructure.mapper;

import com.regalia.backend.pago.infrastructure.entity.PagoEntity;
import com.regalia.backend.pedido.api.dto.PedidoRecibidoDetalleProductoResponse;
import com.regalia.backend.pedido.api.dto.PedidoRecibidoDetalleResponse;
import com.regalia.backend.pedido.api.dto.PedidoRecibidoPagoResponse;
import com.regalia.backend.pedido.api.dto.PedidoRecibidoResumenResponse;
import com.regalia.backend.pedido.infrastructure.entity.DetallePedidoEntity;
import com.regalia.backend.pedido.infrastructure.entity.PedidoEntity;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Mapper encargado de transformar entidades de pedido a respuestas
 * específicas para la vista del vendedor.
 *
 * Se mantiene separado de PedidoMapper para no mezclar la respuesta
 * del cliente con la respuesta del vendedor.
 */
@Component
public class PedidoRecibidoMapper {

    /**
     * Convierte un pedido en una respuesta resumida para la bandeja
     * de pedidos recibidos del vendedor.
     */
    public PedidoRecibidoResumenResponse toResumenResponse(
            PedidoEntity pedido,
            List<DetallePedidoEntity> detalles,
            BigDecimal montoPagado,
            BigDecimal saldoPendiente
    ) {
        return new PedidoRecibidoResumenResponse(
                pedido.getIdPedido(),
                pedido.getUsuario().getIdUsuario(),
                pedido.getUsuario().getCorreo(),
                pedido.getTienda().getIdTienda(),
                pedido.getTienda().getNombre(),
                pedido.getFechaEntrega(),
                pedido.getEstadoPedido(),
                pedido.getTotal(),
                montoPagado,
                saldoPendiente,
                calcularCantidadItems(detalles),
                pedido.getFechaCreacion()
        );
    }

    /**
     * Convierte un pedido en una respuesta detallada para que el vendedor
     * pueda revisar productos y pagos asociados.
     */
    public PedidoRecibidoDetalleResponse toDetalleResponse(
            PedidoEntity pedido,
            List<DetallePedidoEntity> detalles,
            BigDecimal montoPagado,
            BigDecimal saldoPendiente,
            List<PagoEntity> pagos
    ) {
        return new PedidoRecibidoDetalleResponse(
                pedido.getIdPedido(),
                pedido.getUsuario().getIdUsuario(),
                pedido.getUsuario().getCorreo(),
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
                calcularCantidadItems(detalles),
                pedido.getEstado(),
                pedido.getFechaCreacion(),
                pedido.getFechaActualizacion(),
                toDetalleProductoResponses(detalles),
                toPagoResponses(pagos)
        );
    }

    private List<PedidoRecibidoDetalleProductoResponse> toDetalleProductoResponses(
            List<DetallePedidoEntity> detalles
    ) {
        return detalles.stream()
                .map(detalle -> {
                    BigDecimal subtotal = detalle.getPrecioUnitario()
                            .multiply(BigDecimal.valueOf(detalle.getCantidad()));

                    return new PedidoRecibidoDetalleProductoResponse(
                            detalle.getIdDetallePedido(),
                            detalle.getProducto().getIdProducto(),
                            detalle.getProducto().getNombre(),
                            detalle.getCantidad(),
                            detalle.getPrecioUnitario(),
                            subtotal
                    );
                })
                .toList();
    }

    private List<PedidoRecibidoPagoResponse> toPagoResponses(List<PagoEntity> pagos) {
        return pagos.stream()
                .map(pago -> new PedidoRecibidoPagoResponse(
                        pago.getIdPago(),
                        pago.getTipoPago().getCodigo(),
                        pago.getTipoPago().getNombre(),
                        pago.getMonto(),
                        pago.getEstadoPago(),
                        pago.getMetodoPagoPasarela(),
                        pago.getCodigoTransaccion(),
                        pago.getFechaCreacion()
                ))
                .toList();
    }

    private Integer calcularCantidadItems(List<DetallePedidoEntity> detalles) {
        return detalles.stream()
                .map(DetallePedidoEntity::getCantidad)
                .reduce(0, Integer::sum);
    }
}
