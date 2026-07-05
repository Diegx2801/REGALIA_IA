package com.regalia.backend.pedido.infrastructure.repository;

import com.regalia.backend.pedido.application.PedidoAdminSortField;
import com.regalia.backend.pedido.application.PedidoPagoFiltro;
import com.regalia.backend.pedido.application.PedidoSearchField;
import com.regalia.backend.pedido.infrastructure.entity.PedidoEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Consultas administrativas avanzadas de pedidos.
 */
public interface PedidoAdminRepositoryCustom {

    Page<PedidoEntity> findPedidosAdministracion(
            PedidoPagoFiltro filtroPago,
            PedidoSearchField campoBusqueda,
            String busqueda,
            Long busquedaId,
            PedidoAdminSortField sortField,
            Sort.Direction sortDirection,
            Pageable pageable
    );
}
