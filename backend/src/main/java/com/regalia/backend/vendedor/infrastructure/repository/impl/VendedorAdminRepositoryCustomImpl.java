package com.regalia.backend.vendedor.infrastructure.repository.impl;

import com.regalia.backend.vendedor.application.VendedorAdminSortField;
import com.regalia.backend.vendedor.application.VendedorEstadoFiltro;
import com.regalia.backend.vendedor.application.VendedorSearchField;
import com.regalia.backend.vendedor.application.VendedorVerificacionFiltro;
import com.regalia.backend.vendedor.infrastructure.entity.VendedorEntity;
import com.regalia.backend.vendedor.infrastructure.repository.VendedorAdminRepositoryCustom;
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
 * Implementacion con EntityManager para consultas administrativas paginadas de vendedores.
 */
@RequiredArgsConstructor
@Repository
public class VendedorAdminRepositoryCustomImpl implements VendedorAdminRepositoryCustom {

    private static final String DOCUMENTO_VERIFICADO_IDENTIDAD_EXISTS = """
            EXISTS (
                SELECT 1
                FROM UsuarioDocumentoEntity ud
                WHERE ud.usuario = u
                  AND ud.estado = true
                  AND UPPER(ud.estadoVerificacion) = UPPER(:estadoVerificado)
                  AND ud.tipoDocumento.estado = true
                  AND ud.tipoDocumento.categoriaDocumento.estado = true
                  AND UPPER(ud.tipoDocumento.categoriaDocumento.nombre) = UPPER(:categoriaIdentidadPersonal)
            )
            """;

    private final EntityManager entityManager;

    @Override
    public Page<VendedorEntity> findVendedoresAdministracion(
            VendedorEstadoFiltro filtroEstado,
            VendedorVerificacionFiltro filtroVerificacion,
            VendedorSearchField campoBusqueda,
            String busqueda,
            Long busquedaId,
            String estadoVerificado,
            String categoriaIdentidadPersonal,
            VendedorAdminSortField sortField,
            Sort.Direction sortDirection,
            Pageable pageable
    ) {
        Map<String, Object> parametros = new HashMap<>();
        String where = construirWhere(
                filtroEstado,
                filtroVerificacion,
                campoBusqueda,
                busqueda,
                busquedaId,
                estadoVerificado,
                categoriaIdentidadPersonal,
                parametros
        );

        TypedQuery<VendedorEntity> query = entityManager.createQuery(
                """
                        SELECT v
                        FROM VendedorEntity v
                        JOIN FETCH v.usuario u
                        """ + where + construirOrden(sortField, sortDirection),
                VendedorEntity.class
        );
        aplicarParametros(query, parametros);
        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());

        List<VendedorEntity> contenido = query.getResultList();

        TypedQuery<Long> countQuery = entityManager.createQuery(
                """
                        SELECT COUNT(v)
                        FROM VendedorEntity v
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
            VendedorEstadoFiltro filtroEstado,
            VendedorVerificacionFiltro filtroVerificacion,
            VendedorSearchField campoBusqueda,
            String busqueda,
            Long busquedaId,
            String estadoVerificado,
            String categoriaIdentidadPersonal,
            Map<String, Object> parametros
    ) {
        StringBuilder where = new StringBuilder(" WHERE 1 = 1");

        agregarFiltroEstado(where, filtroEstado, parametros);
        agregarFiltroVerificacion(
                where,
                filtroVerificacion,
                estadoVerificado,
                categoriaIdentidadPersonal,
                parametros
        );
        agregarBusqueda(where, campoBusqueda, busqueda, busquedaId, parametros);

        return where.toString();
    }

    private void agregarFiltroEstado(
            StringBuilder where,
            VendedorEstadoFiltro filtroEstado,
            Map<String, Object> parametros
    ) {
        Boolean estado = filtroEstado.toEstadoBoolean();

        if (estado == null) {
            return;
        }

        where.append(" AND v.estado = :estado");
        parametros.put("estado", estado);
    }

    private void agregarFiltroVerificacion(
            StringBuilder where,
            VendedorVerificacionFiltro filtroVerificacion,
            String estadoVerificado,
            String categoriaIdentidadPersonal,
            Map<String, Object> parametros
    ) {
        if (filtroVerificacion == VendedorVerificacionFiltro.TODOS) {
            return;
        }

        parametros.put("estadoVerificado", estadoVerificado);
        parametros.put("categoriaIdentidadPersonal", categoriaIdentidadPersonal);

        if (filtroVerificacion == VendedorVerificacionFiltro.VERIFICADO) {
            where.append(" AND ").append(DOCUMENTO_VERIFICADO_IDENTIDAD_EXISTS);
            return;
        }

        where.append(" AND NOT ").append(DOCUMENTO_VERIFICADO_IDENTIDAD_EXISTS);
    }

    private void agregarBusqueda(
            StringBuilder where,
            VendedorSearchField campoBusqueda,
            String busqueda,
            Long busquedaId,
            Map<String, Object> parametros
    ) {
        if (busqueda == null) {
            return;
        }

        switch (campoBusqueda) {
            case NOMBRE -> {
                where.append(" AND LOWER(CONCAT(CONCAT(COALESCE(u.nombre, ''), ' '), COALESCE(u.apellido, ''))) LIKE LOWER(CONCAT('%', :search, '%'))");
                parametros.put("search", busqueda);
            }
            case CORREO -> {
                where.append(" AND LOWER(COALESCE(u.correo, '')) LIKE LOWER(CONCAT('%', :search, '%'))");
                parametros.put("search", busqueda);
            }
            case ID_VENDEDOR -> {
                where.append(" AND v.idVendedor = :searchId");
                parametros.put("searchId", busquedaId);
            }
            case ID_USUARIO -> {
                where.append(" AND u.idUsuario = :searchId");
                parametros.put("searchId", busquedaId);
            }
        }
    }

    private String construirOrden(
            VendedorAdminSortField sortField,
            Sort.Direction sortDirection
    ) {
        String direction = sortDirection == Sort.Direction.ASC ? " ASC" : " DESC";
        String expression = switch (sortField) {
            case ID_VENDEDOR -> "v.idVendedor";
            case ID_USUARIO -> "u.idUsuario";
            case NOMBRE -> "LOWER(CONCAT(CONCAT(COALESCE(u.nombre, ''), ' '), COALESCE(u.apellido, '')))";
            case CORREO -> "LOWER(u.correo)";
            case FECHA_CREACION -> "v.fechaCreacion";
        };

        return " ORDER BY " + expression + direction + ", v.idVendedor ASC";
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
