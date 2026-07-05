package com.regalia.backend.tienda.infrastructure.repository;

import com.regalia.backend.tienda.application.TiendaAdminSortField;
import com.regalia.backend.tienda.application.TiendaSearchField;
import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Consultas administrativas avanzadas de tiendas.
 */
public interface TiendaAdminRepositoryCustom {

    Page<TiendaEntity> findTiendasAdministracion(
            String estadoRevision,
            TiendaSearchField campoBusqueda,
            String busqueda,
            Long busquedaId,
            TiendaAdminSortField sortField,
            Sort.Direction sortDirection,
            Pageable pageable
    );
}
