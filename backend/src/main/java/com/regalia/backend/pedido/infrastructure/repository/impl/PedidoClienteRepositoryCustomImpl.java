package com.regalia.backend.pedido.infrastructure.repository.impl;

import com.regalia.backend.pago.infrastructure.entity.PagoEntity;
import com.regalia.backend.pedido.application.PedidoClienteEstadoFiltro;
import com.regalia.backend.pedido.application.PedidoClienteResumen;
import com.regalia.backend.pedido.application.PedidoClienteSortField;
import com.regalia.backend.pedido.application.PedidoPagoFiltro;
import com.regalia.backend.pedido.infrastructure.repository.PedidoClienteRepositoryCustom;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Implementacion paginada del historial propio del cliente.
 *
 * La consulta agrega los pagos aprobados en la misma pagina y evita cargar
 * productos o pagos por cada pedido. El detalle completo se consulta por ID.
 */
@RequiredArgsConstructor
@Repository
public class PedidoClienteRepositoryCustomImpl implements PedidoClienteRepositoryCustom {

    private static final String MONTO_PAGADO_APROBADO = """
            COALESCE((
                SELECT SUM(pgSubconsulta.monto)
                FROM PagoEntity pgSubconsulta
                WHERE pgSubconsulta.pedido = p
                  AND pgSubconsulta.estado = true
                  AND pgSubconsulta.estadoPago = :estadoPagoAprobado
            ), :montoCero)
            """;

    private static final String MONTO_PAGADO_AGREGADO = """
            COALESCE(SUM(CASE
                WHEN pg.estado = true AND pg.estadoPago = :estadoPagoAprobado THEN pg.monto
                ELSE :montoCero
            END), :montoCero)
            """;

    private final EntityManager entityManager;

    @Override
    public Page<PedidoClienteResumen> findPedidosCliente(
            Long idUsuario,
            String busqueda,
            Long idPedidoBuscado,
            PedidoClienteEstadoFiltro filtroEstado,
            PedidoPagoFiltro filtroPago,
            PedidoClienteSortField sortField,
            Sort.Direction sortDirection,
            Pageable pageable
    ) {
        Map<String, Object> parametros = new HashMap<>();
        parametros.put("idUsuario", idUsuario);
        parametros.put("estadoPagoAprobado", PagoEntity.ESTADO_APROBADO);
        parametros.put("montoCero", BigDecimal.ZERO);

        String where = construirWhere(
                busqueda,
                idPedidoBuscado,
                filtroEstado,
                filtroPago,
                parametros
        );

        String select = """
                SELECT NEW com.regalia.backend.pedido.application.PedidoClienteResumen(
                    p.idPedido,
                    t.nombre,
                    te.nombre,
                    p.fechaEntrega,
                    p.estadoPedido,
                    p.total,
                    """ + MONTO_PAGADO_AGREGADO + ", p.fechaCreacion) "
                + " FROM PedidoEntity p"
                + " JOIN p.tienda t"
                + " JOIN p.tipoEntrega te"
                + " LEFT JOIN PagoEntity pg ON pg.pedido = p";

        String groupBy = """
                 GROUP BY p.idPedido, t.nombre, te.nombre, p.fechaEntrega,
                          p.estadoPedido, p.total, p.fechaCreacion
                """;

        TypedQuery<PedidoClienteResumen> query = entityManager.createQuery(
                select + where + groupBy + construirOrden(sortField, sortDirection),
                PedidoClienteResumen.class
        );
        aplicarParametros(query, parametros);
        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());

        List<PedidoClienteResumen> contenido = query.getResultList();

        TypedQuery<Long> countQuery = entityManager.createQuery(
                "SELECT COUNT(p) FROM PedidoEntity p JOIN p.tienda t" + where,
                Long.class
        );
        aplicarParametros(countQuery, parametros);

        return new PageImpl<>(contenido, pageable, countQuery.getSingleResult());
    }

    private String construirWhere(
            String busqueda,
            Long idPedidoBuscado,
            PedidoClienteEstadoFiltro filtroEstado,
            PedidoPagoFiltro filtroPago,
            Map<String, Object> parametros
    ) {
        StringBuilder where = new StringBuilder(
                " WHERE p.estado = true AND p.usuario.idUsuario = :idUsuario"
        );

        agregarBusqueda(where, busqueda, idPedidoBuscado, parametros);
        agregarFiltroEstado(where, filtroEstado, parametros);
        agregarFiltroPago(where, filtroPago);

        return where.toString();
    }

    private void agregarBusqueda(
            StringBuilder where,
            String busqueda,
            Long idPedidoBuscado,
            Map<String, Object> parametros
    ) {
        if (busqueda == null) {
            return;
        }

        where.append(" AND (")
                .append("LOWER(COALESCE(t.nombre, '')) LIKE LOWER(CONCAT('%', :busqueda, '%'))");

        parametros.put("busqueda", busqueda);

        if (idPedidoBuscado != null) {
            where.append(" OR p.idPedido = :idPedidoBuscado");
            parametros.put("idPedidoBuscado", idPedidoBuscado);
        }

        where.append(")");
    }

    private void agregarFiltroEstado(
            StringBuilder where,
            PedidoClienteEstadoFiltro filtroEstado,
            Map<String, Object> parametros
    ) {
        if (filtroEstado == PedidoClienteEstadoFiltro.TODOS) {
            return;
        }

        where.append(" AND p.estadoPedido = :estadoPedido");
        parametros.put("estadoPedido", filtroEstado.estadoPedido());
    }

    private void agregarFiltroPago(StringBuilder where, PedidoPagoFiltro filtroPago) {
        if (filtroPago == PedidoPagoFiltro.PAGADO) {
            where.append(" AND ").append(MONTO_PAGADO_APROBADO).append(" >= p.total");
            return;
        }

        if (filtroPago == PedidoPagoFiltro.CON_SALDO) {
            where.append(" AND ").append(MONTO_PAGADO_APROBADO).append(" < p.total");
        }
    }

    private String construirOrden(PedidoClienteSortField sortField, Sort.Direction sortDirection) {
        String direction = sortDirection == Sort.Direction.ASC ? " ASC" : " DESC";
        String expression = switch (sortField) {
            case FECHA_CREACION -> "p.fechaCreacion";
            case FECHA_ENTREGA -> "p.fechaEntrega";
            case NOMBRE_TIENDA -> "LOWER(t.nombre)";
            case TOTAL -> "p.total";
            case SALDO_PENDIENTE -> "(p.total - " + MONTO_PAGADO_AGREGADO + ")";
        };

        return " ORDER BY " + expression + direction + ", p.idPedido DESC";
    }

    private void aplicarParametros(TypedQuery<?> query, Map<String, Object> parametros) {
        query.getParameters()
                .stream()
                .map(Parameter::getName)
                .filter(parametros::containsKey)
                .forEach(nombre -> query.setParameter(nombre, parametros.get(nombre)));
    }
}
