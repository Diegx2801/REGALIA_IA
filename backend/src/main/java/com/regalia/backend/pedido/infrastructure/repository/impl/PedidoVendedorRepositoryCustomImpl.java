package com.regalia.backend.pedido.infrastructure.repository.impl;

import com.regalia.backend.pago.infrastructure.entity.PagoEntity;
import com.regalia.backend.pedido.application.PedidoClienteEstadoFiltro;
import com.regalia.backend.pedido.application.PedidoPagoFiltro;
import com.regalia.backend.pedido.application.PedidoVendedorResumen;
import com.regalia.backend.pedido.application.PedidoVendedorSortField;
import com.regalia.backend.pedido.infrastructure.repository.PedidoVendedorRepositoryCustom;
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
 * Lectura paginada sin N+1 para pedidos vendedor. Pagos e items se agregan en
 * subconsultas, evitando multiplicar montos al unir ambas colecciones.
 */
@RequiredArgsConstructor
@Repository
public class PedidoVendedorRepositoryCustomImpl implements PedidoVendedorRepositoryCustom {

    private static final String MONTO_PAGADO_APROBADO = """
            COALESCE((
                SELECT SUM(pgSubconsulta.monto)
                FROM PagoEntity pgSubconsulta
                WHERE pgSubconsulta.pedido = p
                  AND pgSubconsulta.estado = true
                  AND pgSubconsulta.estadoPago = :estadoPagoAprobado
            ), :montoCero)
            """;

    private static final String CANTIDAD_ITEMS = """
            COALESCE((
                SELECT SUM(detalleSubconsulta.cantidad)
                FROM DetallePedidoEntity detalleSubconsulta
                WHERE detalleSubconsulta.pedido = p
                  AND detalleSubconsulta.estado = true
            ), 0)
            """;

    private final EntityManager entityManager;

    @Override
    public Page<PedidoVendedorResumen> findPedidosVendedor(
            String correoVendedor, Long idTienda, String busqueda, Long idPedidoBuscado,
            PedidoClienteEstadoFiltro filtroEstado, PedidoPagoFiltro filtroPago,
            PedidoVendedorSortField sortField, Sort.Direction sortDirection, Pageable pageable
    ) {
        Map<String, Object> parametros = new HashMap<>();
        parametros.put("correoVendedor", correoVendedor);
        parametros.put("estadoPagoAprobado", PagoEntity.ESTADO_APROBADO);
        parametros.put("montoCero", BigDecimal.ZERO);

        String where = construirWhere(idTienda, busqueda, idPedidoBuscado, filtroEstado, filtroPago, parametros);
        String desde = " FROM PedidoEntity p"
                + " JOIN p.usuario cliente"
                + " JOIN p.tienda tienda"
                + " JOIN tienda.vendedor vendedor"
                + " JOIN vendedor.usuario usuarioVendedor";
        String select = """
                SELECT NEW com.regalia.backend.pedido.application.PedidoVendedorResumen(
                    p.idPedido, cliente.idUsuario, cliente.correo, tienda.idTienda, tienda.nombre,
                    p.fechaEntrega, p.estadoPedido, p.total, """ + MONTO_PAGADO_APROBADO
                + ", " + CANTIDAD_ITEMS + ", p.fechaCreacion)";

        TypedQuery<PedidoVendedorResumen> query = entityManager.createQuery(
                select + desde + where + construirOrden(sortField, sortDirection), PedidoVendedorResumen.class
        );
        aplicarParametros(query, parametros);
        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());

        TypedQuery<Long> countQuery = entityManager.createQuery("SELECT COUNT(p)" + desde + where, Long.class);
        aplicarParametros(countQuery, parametros);

        return new PageImpl<>(query.getResultList(), pageable, countQuery.getSingleResult());
    }

    private String construirWhere(
            Long idTienda, String busqueda, Long idPedidoBuscado,
            PedidoClienteEstadoFiltro filtroEstado, PedidoPagoFiltro filtroPago,
            Map<String, Object> parametros
    ) {
        StringBuilder where = new StringBuilder(
                " WHERE p.estado = true AND usuarioVendedor.correo = :correoVendedor"
        );

        if (idTienda != null) {
            where.append(" AND tienda.idTienda = :idTienda");
            parametros.put("idTienda", idTienda);
        }
        if (busqueda != null) {
            where.append(" AND (LOWER(COALESCE(tienda.nombre, '')) LIKE LOWER(CONCAT('%', :busqueda, '%'))")
                    .append(" OR LOWER(COALESCE(cliente.correo, '')) LIKE LOWER(CONCAT('%', :busqueda, '%'))");
            parametros.put("busqueda", busqueda);
            if (idPedidoBuscado != null) {
                where.append(" OR p.idPedido = :idPedidoBuscado");
                parametros.put("idPedidoBuscado", idPedidoBuscado);
            }
            where.append(")");
        }
        if (filtroEstado != PedidoClienteEstadoFiltro.TODOS) {
            where.append(" AND p.estadoPedido = :estadoPedido");
            parametros.put("estadoPedido", filtroEstado.estadoPedido());
        }
        if (filtroPago == PedidoPagoFiltro.PAGADO) {
            where.append(" AND ").append(MONTO_PAGADO_APROBADO).append(" >= p.total");
        } else if (filtroPago == PedidoPagoFiltro.CON_SALDO) {
            where.append(" AND ").append(MONTO_PAGADO_APROBADO).append(" < p.total");
        }
        return where.toString();
    }

    private String construirOrden(PedidoVendedorSortField sortField, Sort.Direction sortDirection) {
        String direccion = sortDirection == Sort.Direction.ASC ? " ASC" : " DESC";
        String expression = switch (sortField) {
            case FECHA_CREACION -> "p.fechaCreacion";
            case FECHA_ENTREGA -> "p.fechaEntrega";
            case NOMBRE_TIENDA -> "LOWER(tienda.nombre)";
            case TOTAL -> "p.total";
            case SALDO_PENDIENTE -> "(p.total - " + MONTO_PAGADO_APROBADO + ")";
        };
        return " ORDER BY " + expression + direccion + ", p.idPedido DESC";
    }

    private void aplicarParametros(TypedQuery<?> query, Map<String, Object> parametros) {
        query.getParameters().stream().map(Parameter::getName).filter(parametros::containsKey)
                .forEach(nombre -> query.setParameter(nombre, parametros.get(nombre)));
    }
}
