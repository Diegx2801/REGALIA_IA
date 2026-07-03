package com.regalia.backend.usuario.infrastructure.repository.impl;

import com.regalia.backend.usuario.application.UsuarioAdminSortField;
import com.regalia.backend.usuario.application.UsuarioEstadoFiltro;
import com.regalia.backend.usuario.application.UsuarioSearchField;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioAdminRepositoryCustom;
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
 * Implementacion con EntityManager para consultas administrativas paginadas de usuarios.
 */
@RequiredArgsConstructor
@Repository
public class UsuarioAdminRepositoryCustomImpl implements UsuarioAdminRepositoryCustom {

    private final EntityManager entityManager;

    @Override
    public Page<UsuarioEntity> findUsuariosGestionablesAdministracion(
            String rolExcluido,
            UsuarioEstadoFiltro filtroEstado,
            UsuarioSearchField campoBusqueda,
            String busqueda,
            Long busquedaId,
            UsuarioAdminSortField sortField,
            Sort.Direction sortDirection,
            Pageable pageable
    ) {
        Map<String, Object> parametros = new HashMap<>();
        parametros.put("rolExcluido", rolExcluido);

        String where = construirWhere(
                filtroEstado,
                campoBusqueda,
                busqueda,
                busquedaId,
                parametros
        );

        TypedQuery<UsuarioEntity> query = entityManager.createQuery(
                """
                        SELECT u
                        FROM UsuarioEntity u
                        """ + where + construirOrden(sortField, sortDirection),
                UsuarioEntity.class
        );
        aplicarParametros(query, parametros);
        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());

        List<UsuarioEntity> contenido = query.getResultList();

        TypedQuery<Long> countQuery = entityManager.createQuery(
                """
                        SELECT COUNT(u)
                        FROM UsuarioEntity u
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
            UsuarioEstadoFiltro filtroEstado,
            UsuarioSearchField campoBusqueda,
            String busqueda,
            Long busquedaId,
            Map<String, Object> parametros
    ) {
        StringBuilder where = new StringBuilder("""
                 WHERE NOT EXISTS (
                     SELECT 1
                     FROM UsuarioRolEntity ur
                     WHERE ur.usuario = u
                       AND ur.estado = true
                       AND UPPER(ur.rol.nombre) = UPPER(:rolExcluido)
                 )
                """);

        agregarFiltroEstado(where, filtroEstado, parametros);
        agregarBusqueda(where, campoBusqueda, busqueda, busquedaId, parametros);

        return where.toString();
    }

    private void agregarFiltroEstado(
            StringBuilder where,
            UsuarioEstadoFiltro filtroEstado,
            Map<String, Object> parametros
    ) {
        Boolean estado = filtroEstado.toEstadoBoolean();

        if (estado == null) {
            return;
        }

        where.append(" AND u.estado = :estado");
        parametros.put("estado", estado);
    }

    private void agregarBusqueda(
            StringBuilder where,
            UsuarioSearchField campoBusqueda,
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
            case TELEFONO -> {
                where.append(" AND LOWER(COALESCE(u.telefono, '')) LIKE LOWER(CONCAT('%', :search, '%'))");
                parametros.put("search", busqueda);
            }
            case ID_USUARIO -> {
                where.append(" AND u.idUsuario = :searchId");
                parametros.put("searchId", busquedaId);
            }
        }
    }

    private String construirOrden(
            UsuarioAdminSortField sortField,
            Sort.Direction sortDirection
    ) {
        String direction = sortDirection == Sort.Direction.ASC ? " ASC" : " DESC";
        String expression = switch (sortField) {
            case ID_USUARIO -> "u.idUsuario";
            case NOMBRE -> "LOWER(CONCAT(CONCAT(COALESCE(u.nombre, ''), ' '), COALESCE(u.apellido, '')))";
            case CORREO -> "LOWER(u.correo)";
            case FECHA_CREACION -> "u.fechaCreacion";
        };

        return " ORDER BY " + expression + direction + ", u.idUsuario ASC";
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
