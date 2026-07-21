package com.regalia.backend.pedido.infrastructure.repository.impl;

import com.regalia.backend.pago.infrastructure.entity.PagoEntity;
import com.regalia.backend.pedido.application.PedidoAdminSortField;
import com.regalia.backend.pedido.application.PedidoAdminEstadoFiltro;
import com.regalia.backend.pedido.application.PedidoPagoFiltro;
import com.regalia.backend.pedido.application.PedidoSearchField;
import com.regalia.backend.pedido.infrastructure.entity.PedidoEntity;
import com.regalia.backend.pedido.infrastructure.repository.PedidoAdminRepositoryCustom;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Parameter;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Implementacion con EntityManager para consultas administrativas paginadas.
 */
@RequiredArgsConstructor
@Repository
public class PedidoAdminRepositoryCustomImpl implements PedidoAdminRepositoryCustom {

    private static final String MONTO_PAGADO_APROBADO = """
            COALESCE((
                SELECT SUM(pg.monto)
                FROM PagoEntity pg
                WHERE pg.pedido = p
                  AND pg.estado = true
                  AND pg.estadoPago = :estadoPagoAprobado
            ), :montoCero)
            """;

    private final EntityManager entityManager;

    @Override
    public Page<PedidoEntity> findPedidosAdministracion(
            PedidoPagoFiltro filtroPago,
            PedidoAdminEstadoFiltro filtroEstadoPedido,
            Long idTienda,
            PedidoSearchField campoBusqueda,
            String busqueda,
            Long busquedaId,
            LocalDateTime fechaCreacionDesde,
            LocalDateTime fechaCreacionHastaExclusiva,
            PedidoAdminSortField sortField,
            Sort.Direction sortDirection,
            Pageable pageable
    ) {
        Map<String, Object> parametros = new HashMap<>();
        parametros.put("estadoPagoAprobado", PagoEntity.ESTADO_APROBADO);
        parametros.put("montoCero", BigDecimal.ZERO);

        String where = construirWhere(
                filtroPago,
                filtroEstadoPedido,
                idTienda,
                campoBusqueda,
                busqueda,
                busquedaId,
                fechaCreacionDesde,
                fechaCreacionHastaExclusiva,
                parametros
        );

        String select = """
                SELECT p
                FROM PedidoEntity p
                JOIN FETCH p.tienda t
                JOIN FETCH p.usuario u
                JOIN FETCH p.tipoEntrega te
                """;

        TypedQuery<PedidoEntity> query = entityManager.createQuery(
                select + where + construirOrden(sortField, sortDirection),
                PedidoEntity.class
        );
        aplicarParametros(query, parametros);
        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());

        List<PedidoEntity> contenido = query.getResultList();

        TypedQuery<Long> countQuery = entityManager.createQuery(
                """
                        SELECT COUNT(p)
                        FROM PedidoEntity p
                        JOIN p.tienda t
                        JOIN p.usuario u
                        """ + where,
                Long.class
        );
        aplicarParametros(countQuery, parametros);

        return new PageImpl<>(
                contenido,
                pageable,
                countQuery.getSingleResult()
        );
    }

    private String construirWhere(
            PedidoPagoFiltro filtroPago,
            PedidoAdminEstadoFiltro filtroEstadoPedido,
            Long idTienda,
            PedidoSearchField campoBusqueda,
            String busqueda,
            Long busquedaId,
            LocalDateTime fechaCreacionDesde,
            LocalDateTime fechaCreacionHastaExclusiva,
            Map<String, Object> parametros
    ) {
        StringBuilder where = new StringBuilder(" WHERE p.estado = true");

        agregarBusqueda(where, campoBusqueda, busqueda, busquedaId, parametros);
        agregarFiltroPago(where, filtroPago);
        agregarFiltroEstadoPedido(where, filtroEstadoPedido, parametros);
        agregarFiltroTienda(where, idTienda, parametros);
        agregarFiltroFechas(
                where,
                fechaCreacionDesde,
                fechaCreacionHastaExclusiva,
                parametros
        );

        return where.toString();
    }

    private void agregarBusqueda(
            StringBuilder where,
            PedidoSearchField campoBusqueda,
            String busqueda,
            Long busquedaId,
            Map<String, Object> parametros
    ) {
        if (busqueda == null) {
            return;
        }

        switch (campoBusqueda) {
            case ID_PEDIDO -> {
                where.append(" AND p.idPedido = :searchId");
                parametros.put("searchId", busquedaId);
            }
            case NOMBRE_TIENDA -> {
                where.append(" AND LOWER(COALESCE(t.nombre, '')) LIKE LOWER(CONCAT('%', :search, '%'))");
                parametros.put("search", busqueda);
            }
            case ID_USUARIO -> {
                where.append(" AND u.idUsuario = :searchId");
                parametros.put("searchId", busquedaId);
            }
            case ID_TIENDA -> {
                where.append(" AND t.idTienda = :searchId");
                parametros.put("searchId", busquedaId);
            }
            case ESTADO_PEDIDO -> {
                where.append(" AND LOWER(COALESCE(p.estadoPedido, '')) LIKE LOWER(CONCAT('%', :search, '%'))");
                parametros.put("search", busqueda);
            }
        }
    }

    private void agregarFiltroPago(
            StringBuilder where,
            PedidoPagoFiltro filtroPago
    ) {
        if (filtroPago == PedidoPagoFiltro.PAGADO) {
            where.append(" AND ").append(MONTO_PAGADO_APROBADO).append(" >= p.total");
            return;
        }

        if (filtroPago == PedidoPagoFiltro.CON_SALDO) {
            where.append(" AND ").append(MONTO_PAGADO_APROBADO).append(" < p.total");
        }
    }

    private void agregarFiltroEstadoPedido(
            StringBuilder where,
            PedidoAdminEstadoFiltro filtroEstadoPedido,
            Map<String, Object> parametros
    ) {
        if (filtroEstadoPedido == PedidoAdminEstadoFiltro.TODOS) {
            return;
        }

        where.append(" AND p.estadoPedido = :estadoPedido");
        parametros.put("estadoPedido", filtroEstadoPedido.estadoPedido());
    }

    private void agregarFiltroTienda(
            StringBuilder where,
            Long idTienda,
            Map<String, Object> parametros
    ) {
        if (idTienda == null) {
            return;
        }

        where.append(" AND t.idTienda = :idTienda");
        parametros.put("idTienda", idTienda);
    }

    private void agregarFiltroFechas(
            StringBuilder where,
            LocalDateTime fechaCreacionDesde,
            LocalDateTime fechaCreacionHastaExclusiva,
            Map<String, Object> parametros
    ) {
        if (fechaCreacionDesde != null) {
            where.append(" AND p.fechaCreacion >= :fechaCreacionDesde");
            parametros.put("fechaCreacionDesde", fechaCreacionDesde);
        }

        if (fechaCreacionHastaExclusiva != null) {
            where.append(" AND p.fechaCreacion < :fechaCreacionHastaExclusiva");
            parametros.put("fechaCreacionHastaExclusiva", fechaCreacionHastaExclusiva);
        }
    }

    private String construirOrden(
            PedidoAdminSortField sortField,
            Sort.Direction sortDirection
    ) {
        String direction = sortDirection == Sort.Direction.ASC ? " ASC" : " DESC";
        String expression = switch (sortField) {
            case ID_PEDIDO -> "p.idPedido";
            case FECHA_CREACION -> "p.fechaCreacion";
            case FECHA_ENTREGA -> "p.fechaEntrega";
            case NOMBRE_TIENDA -> "LOWER(t.nombre)";
            case TOTAL -> "p.total";
            case SALDO_PENDIENTE -> "(p.total - " + MONTO_PAGADO_APROBADO + ")";
        };

        return " ORDER BY " + expression + direction + ", p.idPedido DESC";
    }

    private void aplicarParametros(
            TypedQuery<?> query,
            Map<String, Object> parametros
    ) {
        query.getParameters()
                .stream()
                .map(Parameter::getName)
                .filter(parametros::containsKey)
                .forEach(nombre -> query.setParameter(nombre, parametros.get(nombre)));
    }
}
