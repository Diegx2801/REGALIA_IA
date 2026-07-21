package com.regalia.backend.producto.infrastructure.repository.impl;

import com.regalia.backend.producto.application.ProductoPublicoSortField;
import com.regalia.backend.producto.infrastructure.entity.ProductoEntity;
import com.regalia.backend.producto.infrastructure.repository.ProductoPublicoRepositoryCustom;
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
 * Implementacion JPA de la consulta publica para aplicar todos los filtros antes de paginar.
 */
@Repository
@RequiredArgsConstructor
public class ProductoPublicoRepositoryCustomImpl implements ProductoPublicoRepositoryCustom {

    private final EntityManager entityManager;

    @Override
    public Page<ProductoEntity> findPaginaProductosPublicosMarketplace(
            String estadoRevision,
            String busqueda,
            Long idTipoProducto,
            BigDecimal precioMaximo,
            boolean soloDisponibles,
            ProductoPublicoSortField sortField,
            Sort.Direction sortDirection,
            Pageable pageable
    ) {
        Map<String, Object> parametros = new HashMap<>();
        String where = construirWhere(
                estadoRevision,
                busqueda,
                idTipoProducto,
                precioMaximo,
                soloDisponibles,
                parametros
        );

        TypedQuery<ProductoEntity> query = entityManager.createQuery(
                """
                        SELECT p
                        FROM ProductoEntity p
                        JOIN FETCH p.tienda t
                        JOIN FETCH p.tipoProducto tp
                        """ + where + construirOrden(sortField, sortDirection),
                ProductoEntity.class
        );
        aplicarParametros(query, parametros);
        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());

        List<ProductoEntity> contenido = query.getResultList();

        TypedQuery<Long> countQuery = entityManager.createQuery(
                """
                        SELECT COUNT(p)
                        FROM ProductoEntity p
                        JOIN p.tienda t
                        JOIN p.tipoProducto tp
                        """ + where,
                Long.class
        );
        aplicarParametros(countQuery, parametros);

        return new PageImpl<>(contenido, pageable, countQuery.getSingleResult());
    }

    @Override
    public List<ProductoEntity> findCandidatosPublicosBuilderIA(
            String estadoRevision,
            List<String> terminos,
            BigDecimal precioMaximo,
            int limite
    ) {
        Map<String, Object> parametros = new HashMap<>();
        StringBuilder where = new StringBuilder("""
                 WHERE p.estado = true
                 AND p.visibleEnTienda = true
                 AND p.stock > 0
                 AND t.estado = true
                 AND UPPER(t.estadoRevision) = UPPER(:estadoRevision)
                """);
        parametros.put("estadoRevision", estadoRevision);

        if (precioMaximo != null) {
            where.append(" AND p.precio <= :precioMaximo");
            parametros.put("precioMaximo", precioMaximo);
        }

        if (terminos != null && !terminos.isEmpty()) {
            where.append(" AND (");
            for (int indice = 0; indice < terminos.size(); indice++) {
                if (indice > 0) {
                    where.append(" OR ");
                }
                String parametro = "termino" + indice;
                where.append("""
                        CAST(FUNCTION(
                            'translate',
                            LOWER(CONCAT(CONCAT(CONCAT(CONCAT(CONCAT(CONCAT(
                                COALESCE(p.nombre, ''), ' '), COALESCE(p.descripcion, '')), ' '),
                                COALESCE(t.nombre, '')), ' '), COALESCE(tp.nombre, ''))),
                            'áéíóúüñ',
                            'aeiouun'
                        ) AS String) LIKE CONCAT('%%', :%s, '%%')
                        """.formatted(parametro));
                parametros.put(parametro, terminos.get(indice));
            }
            where.append(")");
        }

        TypedQuery<ProductoEntity> query = entityManager.createQuery(
                """
                        SELECT p
                        FROM ProductoEntity p
                        JOIN FETCH p.tienda t
                        JOIN FETCH p.tipoProducto tp
                        """ + where + " ORDER BY p.idProducto ASC",
                ProductoEntity.class
        );
        aplicarParametros(query, parametros);
        query.setMaxResults(limite);
        return query.getResultList();
    }

    private String construirWhere(
            String estadoRevision,
            String busqueda,
            Long idTipoProducto,
            BigDecimal precioMaximo,
            boolean soloDisponibles,
            Map<String, Object> parametros
    ) {
        StringBuilder where = new StringBuilder("""
                 WHERE p.estado = true
                 AND p.visibleEnTienda = true
                 AND t.estado = true
                 AND UPPER(t.estadoRevision) = UPPER(:estadoRevision)
                """);
        parametros.put("estadoRevision", estadoRevision);

        if (busqueda != null) {
            where.append("""
                     AND CAST(FUNCTION(
                             'translate',
                             LOWER(CONCAT(CONCAT(CONCAT(CONCAT(CONCAT(CONCAT(
                                 COALESCE(p.nombre, ''), ' '), COALESCE(p.descripcion, '')), ' '),
                                 COALESCE(t.nombre, '')), ' '), COALESCE(tp.nombre, ''))),
                             'áéíóúüñ',
                             'aeiouun'
                         ) AS String) LIKE CONCAT('%', :search, '%')
                    """);
            parametros.put("search", busqueda);
        }

        if (idTipoProducto != null) {
            where.append(" AND tp.idTipoProducto = :idTipoProducto");
            parametros.put("idTipoProducto", idTipoProducto);
        }

        if (precioMaximo != null) {
            where.append(" AND p.precio <= :precioMaximo");
            parametros.put("precioMaximo", precioMaximo);
        }

        if (soloDisponibles) {
            where.append(" AND p.stock > 0");
        }

        return where.toString();
    }

    private String construirOrden(
            ProductoPublicoSortField sortField,
            Sort.Direction sortDirection
    ) {
        if (sortField == ProductoPublicoSortField.RECOMENDADO) {
            return " ORDER BY CASE WHEN p.stock > 0 THEN 0 ELSE 1 END ASC, p.idProducto ASC";
        }

        String direccion = sortDirection == Sort.Direction.DESC ? " DESC" : " ASC";
        return " ORDER BY p.precio" + direccion + ", p.idProducto ASC";
    }

    private void aplicarParametros(TypedQuery<?> query, Map<String, Object> parametros) {
        query.getParameters()
                .stream()
                .map(Parameter::getName)
                .filter(parametros::containsKey)
                .forEach(nombre -> query.setParameter(nombre, parametros.get(nombre)));
    }
}
