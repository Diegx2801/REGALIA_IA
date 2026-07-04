package com.regalia.backend.tienda.infrastructure.repository.impl;

import com.regalia.backend.tienda.application.TiendaAdminSortField;
import com.regalia.backend.tienda.application.TiendaSearchField;
import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import com.regalia.backend.tienda.infrastructure.repository.TiendaAdminRepositoryCustom;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Parameter;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Implementacion con EntityManager para consultas administrativas paginadas de tiendas.
 */
@RequiredArgsConstructor
@Repository
public class TiendaAdminRepositoryCustomImpl implements TiendaAdminRepositoryCustom {

    private final EntityManager entityManager;

    @Override
    public Page<TiendaEntity> findTiendasAdministracion(
            String estadoRevision,
            TiendaSearchField campoBusqueda,
            String busqueda,
            Long busquedaId,
            TiendaAdminSortField sortField,
            Sort.Direction sortDirection,
            Pageable pageable
    ) {
        Map<String, Object> parametros = new HashMap<>();
        String where = construirWhere(
                estadoRevision,
                campoBusqueda,
                busqueda,
                busquedaId,
                parametros
        );

        String select = """
                SELECT t
                FROM TiendaEntity t
                JOIN FETCH t.vendedor v
                JOIN FETCH v.usuario u
                LEFT JOIN FETCH t.documentoFiscal df
                """;

        TypedQuery<TiendaEntity> query = entityManager.createQuery(
                select + where + construirOrden(sortField, sortDirection),
                TiendaEntity.class
        );
        aplicarParametros(query, parametros);
        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());

        List<TiendaEntity> contenido = query.getResultList();

        TypedQuery<Long> countQuery = entityManager.createQuery(
                """
                        SELECT COUNT(t)
                        FROM TiendaEntity t
                        JOIN t.vendedor v
                        JOIN v.usuario u
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
            String estadoRevision,
            TiendaSearchField campoBusqueda,
            String busqueda,
            Long busquedaId,
            Map<String, Object> parametros
    ) {
        StringBuilder where = new StringBuilder(" WHERE t.estado = true");

        agregarEstadoRevision(where, estadoRevision, parametros);
        agregarBusqueda(where, campoBusqueda, busqueda, busquedaId, parametros);

        return where.toString();
    }

    private void agregarEstadoRevision(
            StringBuilder where,
            String estadoRevision,
            Map<String, Object> parametros
    ) {
        if (estadoRevision == null) {
            return;
        }

        where.append(" AND UPPER(t.estadoRevision) = UPPER(:estadoRevision)");
        parametros.put("estadoRevision", estadoRevision);
    }

    private void agregarBusqueda(
            StringBuilder where,
            TiendaSearchField campoBusqueda,
            String busqueda,
            Long busquedaId,
            Map<String, Object> parametros
    ) {
        if (busqueda == null) {
            return;
        }

        switch (campoBusqueda) {
            case NOMBRE -> {
                where.append(" AND LOWER(COALESCE(t.nombre, '')) LIKE LOWER(CONCAT('%', :search, '%'))");
                parametros.put("search", busqueda);
            }
            case VENDEDOR -> {
                where.append(" AND LOWER(CONCAT(CONCAT(COALESCE(u.nombre, ''), ' '), COALESCE(u.apellido, ''))) LIKE LOWER(CONCAT('%', :search, '%'))");
                parametros.put("search", busqueda);
            }
            case CORREO_VENDEDOR -> {
                where.append(" AND LOWER(COALESCE(u.correo, '')) LIKE LOWER(CONCAT('%', :search, '%'))");
                parametros.put("search", busqueda);
            }
            case ID_TIENDA -> {
                where.append(" AND t.idTienda = :searchId");
                parametros.put("searchId", busquedaId);
            }
        }
    }

    private String construirOrden(
            TiendaAdminSortField sortField,
            Sort.Direction sortDirection
    ) {
        String direction = sortDirection == Sort.Direction.ASC ? " ASC" : " DESC";
        String expression = switch (sortField) {
            case ID_TIENDA -> "t.idTienda";
            case NOMBRE -> "LOWER(t.nombre)";
            case ESTADO_REVISION -> "t.estadoRevision";
            case NOMBRE_VENDEDOR -> "LOWER(CONCAT(CONCAT(COALESCE(u.nombre, ''), ' '), COALESCE(u.apellido, '')))";
            case FECHA_CREACION -> "t.fechaCreacion";
        };

        return " ORDER BY " + expression + direction + ", t.idTienda ASC";
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
