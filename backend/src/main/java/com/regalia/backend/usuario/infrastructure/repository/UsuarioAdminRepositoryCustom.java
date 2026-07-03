package com.regalia.backend.usuario.infrastructure.repository;

import com.regalia.backend.usuario.application.UsuarioAdminSortField;
import com.regalia.backend.usuario.application.UsuarioEstadoFiltro;
import com.regalia.backend.usuario.application.UsuarioSearchField;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Consultas administrativas avanzadas de usuarios.
 */
public interface UsuarioAdminRepositoryCustom {

    Page<UsuarioEntity> findUsuariosGestionablesAdministracion(
            String rolExcluido,
            UsuarioEstadoFiltro filtroEstado,
            UsuarioSearchField campoBusqueda,
            String busqueda,
            Long busquedaId,
            UsuarioAdminSortField sortField,
            Sort.Direction sortDirection,
            Pageable pageable
    );
}
