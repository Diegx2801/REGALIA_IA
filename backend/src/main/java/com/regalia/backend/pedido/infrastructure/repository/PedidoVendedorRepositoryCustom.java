package com.regalia.backend.pedido.infrastructure.repository;

import com.regalia.backend.pedido.application.PedidoClienteEstadoFiltro;
import com.regalia.backend.pedido.application.PedidoPagoFiltro;
import com.regalia.backend.pedido.application.PedidoVendedorResumen;
import com.regalia.backend.pedido.application.PedidoVendedorSortField;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/** Consultas paginadas de pedidos recibidos por el vendedor autenticado. */
public interface PedidoVendedorRepositoryCustom {
    Page<PedidoVendedorResumen> findPedidosVendedor(
            String correoVendedor,
            Long idTienda,
            String busqueda,
            Long idPedidoBuscado,
            PedidoClienteEstadoFiltro filtroEstado,
            PedidoPagoFiltro filtroPago,
            PedidoVendedorSortField sortField,
            Sort.Direction sortDirection,
            Pageable pageable
    );
}
