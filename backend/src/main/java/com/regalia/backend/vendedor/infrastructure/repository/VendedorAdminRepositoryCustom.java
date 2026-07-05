package com.regalia.backend.vendedor.infrastructure.repository;

import com.regalia.backend.vendedor.application.VendedorAdminSortField;
import com.regalia.backend.vendedor.application.VendedorEstadoFiltro;
import com.regalia.backend.vendedor.application.VendedorSearchField;
import com.regalia.backend.vendedor.application.VendedorVerificacionFiltro;
import com.regalia.backend.vendedor.infrastructure.entity.VendedorEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Consultas administrativas avanzadas de vendedores.
 */
public interface VendedorAdminRepositoryCustom {

    Page<VendedorEntity> findVendedoresAdministracion(
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
    );
}
