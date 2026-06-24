package com.regalia.backend.pedido.application;

import com.regalia.backend.pago.infrastructure.entity.PagoEntity;
import com.regalia.backend.pago.infrastructure.repository.PagoJpaRepository;
import com.regalia.backend.pedido.api.dto.PedidoRecibidoDetalleResponse;
import com.regalia.backend.pedido.api.dto.PedidoRecibidoResumenResponse;
import com.regalia.backend.pedido.infrastructure.entity.DetallePedidoEntity;
import com.regalia.backend.pedido.infrastructure.entity.PedidoEntity;
import com.regalia.backend.pedido.infrastructure.mapper.PedidoRecibidoMapper;
import com.regalia.backend.pedido.infrastructure.repository.DetallePedidoJpaRepository;
import com.regalia.backend.pedido.infrastructure.repository.PedidoJpaRepository;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Servicio de aplicación para la consulta de pedidos recibidos
 * desde el contexto del vendedor.
 *
 * Este servicio no crea pedidos, no registra pagos y no modifica
 * comisiones. Su responsabilidad es mostrar al vendedor únicamente
 * los pedidos asociados a sus propias tiendas.
 */
@Service
@RequiredArgsConstructor
public class PedidoRecibidoService {

    private static final String ESTADO_PAGO_APROBADO = "APROBADO";

    private final PedidoJpaRepository pedidoRepository;
    private final DetallePedidoJpaRepository detallePedidoRepository;
    private final PagoJpaRepository pagoRepository;
    private final PedidoRecibidoMapper pedidoRecibidoMapper;

    /**
     * Lista todos los pedidos recibidos en las tiendas del vendedor autenticado.
     */
    @Transactional(readOnly = true)
    public List<PedidoRecibidoResumenResponse> listarPedidosRecibidos(String correoVendedor) {
        List<PedidoEntity> pedidos = pedidoRepository
                .listarPedidosRecibidosPorVendedor(correoVendedor);

        return pedidos.stream()
                .map(this::toResumenResponse)
                .toList();
    }

    /**
     * Lista los pedidos recibidos en una tienda específica del vendedor autenticado.
     */
    @Transactional(readOnly = true)
    public List<PedidoRecibidoResumenResponse> listarPedidosRecibidosPorTienda(
            String correoVendedor,
            Long idTienda
    ) {
        List<PedidoEntity> pedidos = pedidoRepository
                .listarPedidosRecibidosPorTiendaDelVendedor(correoVendedor, idTienda);

        return pedidos.stream()
                .map(this::toResumenResponse)
                .toList();
    }

    /**
     * Busca el detalle de un pedido recibido por el vendedor autenticado.
     *
     * La validación de propiedad se realiza mediante:
     * usuario autenticado -> vendedor -> tienda -> pedido.
     */
    @Transactional(readOnly = true)
    public PedidoRecibidoDetalleResponse buscarPedidoRecibidoPorId(
            String correoVendedor,
            Long idPedido
    ) {
        PedidoEntity pedido = pedidoRepository
                .buscarPedidoRecibidoPorVendedor(correoVendedor, idPedido)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el pedido solicitado"
                ));

        List<DetallePedidoEntity> detalles = obtenerDetallesDelPedido(pedido.getIdPedido());
        List<PagoEntity> pagos = obtenerPagosDelPedido(pedido.getIdPedido());

        BigDecimal montoPagado = calcularMontoPagado(pagos);
        BigDecimal saldoPendiente = calcularSaldoPendiente(pedido, montoPagado);

        return pedidoRecibidoMapper.toDetalleResponse(
                pedido,
                detalles,
                montoPagado,
                saldoPendiente,
                pagos
        );
    }

    private PedidoRecibidoResumenResponse toResumenResponse(PedidoEntity pedido) {
        List<DetallePedidoEntity> detalles = obtenerDetallesDelPedido(pedido.getIdPedido());
        List<PagoEntity> pagos = obtenerPagosDelPedido(pedido.getIdPedido());

        BigDecimal montoPagado = calcularMontoPagado(pagos);
        BigDecimal saldoPendiente = calcularSaldoPendiente(pedido, montoPagado);

        return pedidoRecibidoMapper.toResumenResponse(
                pedido,
                detalles,
                montoPagado,
                saldoPendiente
        );
    }

    private List<DetallePedidoEntity> obtenerDetallesDelPedido(Long idPedido) {
        return detallePedidoRepository.buscarDetallesActivosPorPedido(idPedido);
    }

    private List<PagoEntity> obtenerPagosDelPedido(Long idPedido) {
        return pagoRepository.buscarPagosActivosPorPedido(idPedido);
    }

    private BigDecimal calcularMontoPagado(List<PagoEntity> pagos) {
        return pagos.stream()
                .filter(pago -> ESTADO_PAGO_APROBADO.equalsIgnoreCase(pago.getEstadoPago()))
                .map(PagoEntity::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calcularSaldoPendiente(PedidoEntity pedido, BigDecimal montoPagado) {
        BigDecimal saldo = pedido.getTotal().subtract(montoPagado);

        if (saldo.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO;
        }

        return saldo;
    }
}