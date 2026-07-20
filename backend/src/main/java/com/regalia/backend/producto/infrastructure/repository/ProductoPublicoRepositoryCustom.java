package com.regalia.backend.producto.infrastructure.repository;

import com.regalia.backend.producto.application.ProductoPublicoSortField;
import com.regalia.backend.producto.infrastructure.entity.ProductoEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;

/**
 * Consultas paginadas y filtradas del marketplace publico.
 */
public interface ProductoPublicoRepositoryCustom {

    Page<ProductoEntity> findPaginaProductosPublicosMarketplace(
            String estadoRevision,
            String busqueda,
            Long idTipoProducto,
            BigDecimal precioMaximo,
            boolean soloDisponibles,
            ProductoPublicoSortField sortField,
            Sort.Direction sortDirection,
            Pageable pageable
    );
}
