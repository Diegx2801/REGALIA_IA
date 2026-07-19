package com.regalia.backend.pedido.infrastructure.repository;

import com.regalia.backend.pedido.application.PedidoClienteEstadoFiltro;
import com.regalia.backend.pedido.application.PedidoClienteResumen;
import com.regalia.backend.pedido.application.PedidoClienteSortField;
import com.regalia.backend.pedido.application.PedidoPagoFiltro;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Consultas de lectura del historial propio de un cliente autenticado.
 */
public interface PedidoClienteRepositoryCustom {

    Page<PedidoClienteResumen> findPedidosCliente(
            Long idUsuario,
            String busqueda,
            Long idPedidoBuscado,
            PedidoClienteEstadoFiltro filtroEstado,
            PedidoPagoFiltro filtroPago,
            PedidoClienteSortField sortField,
            Sort.Direction sortDirection,
            Pageable pageable
    );
}
