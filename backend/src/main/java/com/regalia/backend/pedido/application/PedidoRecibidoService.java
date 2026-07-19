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
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.shared.response.PaginaResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Consultas privadas de pedidos recibidos por un vendedor.
 *
 * El listado es paginado y ligero; los productos y pagos completos se leen
 * unicamente al solicitar el detalle de un pedido autorizado.
 */
@Service
@RequiredArgsConstructor
public class PedidoRecibidoService {

    private static final String ESTADO_PAGO_APROBADO = "APROBADO";
    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 50;

    private final PedidoJpaRepository pedidoRepository;
    private final DetallePedidoJpaRepository detallePedidoRepository;
    private final PagoJpaRepository pagoRepository;
    private final PedidoRecibidoMapper pedidoRecibidoMapper;

    @Transactional(readOnly = true)
    public PaginaResponse<PedidoRecibidoResumenResponse> listarPedidosRecibidos(
            String correoVendedor,
            Long idTienda,
            String q,
            String estado,
            String estadoPago,
            Integer page,
            Integer size,
            String sort
    ) {
        String busqueda = normalizarBusqueda(q);
        PedidoClienteEstadoFiltro filtroEstado = PedidoClienteEstadoFiltro.desde(estado);
        PedidoPagoFiltro filtroPago = PedidoPagoFiltro.desde(estadoPago);
        PedidoVendedorSortField sortField = PedidoVendedorSortField.desde(sort);
        Sort.Direction sortDirection = PedidoVendedorSortField.direccionDesde(sort);
        int pagina = normalizarPagina(page);
        int tamanioPagina = normalizarTamanioPagina(size);

        Page<PedidoVendedorResumen> pedidos = pedidoRepository.findPedidosVendedor(
                correoVendedor,
                idTienda,
                busqueda,
                obtenerIdPedidoSiAplica(busqueda),
                filtroEstado,
                filtroPago,
                sortField,
                sortDirection,
                PageRequest.of(pagina, tamanioPagina, Sort.by(sortDirection, sortField.apiName()))
        );

        List<PedidoRecibidoResumenResponse> contenido = pedidos.getContent().stream()
                .map(this::toResumenResponse)
                .toList();

        return new PaginaResponse<>(
                contenido,
                pedidos.getNumber(),
                pedidos.getSize(),
                pedidos.getTotalElements(),
                pedidos.getTotalPages(),
                pedidos.isLast()
        );
    }

    /** El detalle mantiene una comprobacion de propiedad en la consulta. */
    @Transactional(readOnly = true)
    public PedidoRecibidoDetalleResponse buscarPedidoRecibidoPorId(
            String correoVendedor,
            Long idPedido
    ) {
        PedidoEntity pedido = pedidoRepository
                .buscarPedidoRecibidoPorVendedor(correoVendedor, idPedido)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontro el pedido solicitado"
                ));

        List<DetallePedidoEntity> detalles = obtenerDetallesDelPedido(pedido.getIdPedido());
        List<PagoEntity> pagos = obtenerPagosDelPedido(pedido.getIdPedido());
        BigDecimal montoPagado = calcularMontoPagado(pagos);

        return pedidoRecibidoMapper.toDetalleResponse(
                pedido,
                detalles,
                montoPagado,
                calcularSaldoPendiente(pedido, montoPagado),
                pagos
        );
    }

    private PedidoRecibidoResumenResponse toResumenResponse(PedidoVendedorResumen pedido) {
        BigDecimal montoPagado = pedido.montoPagado().max(BigDecimal.ZERO);
        BigDecimal saldoPendiente = pedido.total().subtract(montoPagado).max(BigDecimal.ZERO);

        return new PedidoRecibidoResumenResponse(
                pedido.idPedido(),
                pedido.idCliente(),
                pedido.correoCliente(),
                pedido.idTienda(),
                pedido.nombreTienda(),
                pedido.fechaEntrega(),
                pedido.estadoPedido(),
                pedido.total(),
                montoPagado,
                saldoPendiente,
                pedido.cantidadItems().intValue(),
                pedido.fechaCreacion()
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
        return pedido.getTotal().subtract(montoPagado).max(BigDecimal.ZERO);
    }

    private String normalizarBusqueda(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

    private Long obtenerIdPedidoSiAplica(String busqueda) {
        if (busqueda == null) return null;

        try {
            return Long.valueOf(busqueda);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private int normalizarPagina(Integer page) {
        if (page == null) return DEFAULT_PAGE;
        if (page < 0) throw new ReglaNegocioException("La pagina no puede ser negativa");
        return page;
    }

    private int normalizarTamanioPagina(Integer size) {
        if (size == null) return DEFAULT_PAGE_SIZE;
        if (size < 1) throw new ReglaNegocioException("El tamanio de pagina debe ser mayor a cero");
        if (size > MAX_PAGE_SIZE) {
            throw new ReglaNegocioException("El tamanio maximo permitido por pagina es 50");
        }
        return size;
    }
}
