package com.regalia.backend.producto.infrastructure.repository;

import com.regalia.backend.producto.infrastructure.entity.ProductoEntity;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla producto.
 */
public interface ProductoJpaRepository
        extends JpaRepository<ProductoEntity, Long>, ProductoPublicoRepositoryCustom {

    List<ProductoEntity> findByTiendaIdTiendaAndEstadoTrueOrderByIdProductoAsc(Long idTienda);

    List<ProductoEntity> findByTiendaIdTiendaAndEstadoTrueAndVisibleEnTiendaTrueOrderByIdProductoAsc(Long idTienda);

    Optional<ProductoEntity> findByIdProductoAndEstadoTrue(Long idProducto);

    Optional<ProductoEntity> findByIdProductoAndEstadoTrueAndVisibleEnTiendaTrue(Long idProducto);

    boolean existsByTiendaIdTiendaAndNombreIgnoreCaseAndEstadoTrue(Long idTienda, String nombre);

    boolean existsByTiendaIdTiendaAndNombreIgnoreCaseAndEstadoTrueAndIdProductoNot(
            Long idTienda,
            String nombre,
            Long idProducto
    );

    @Query("""
            SELECT p
            FROM ProductoEntity p
            JOIN FETCH p.tienda t
            JOIN FETCH p.tipoProducto tp
            WHERE p.estado = true
            AND p.visibleEnTienda = true
            AND t.estado = true
            AND UPPER(t.estadoRevision) = UPPER(:estadoRevision)
            ORDER BY p.idProducto ASC
            """)
    List<ProductoEntity> findProductosPublicosMarketplace(@Param("estadoRevision") String estadoRevision);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT p
        FROM ProductoEntity p
        JOIN FETCH p.tienda
        WHERE p.idProducto = :idProducto
        AND p.estado = true
        """)
    Optional<ProductoEntity> findActivoParaPedidoPorIdProducto(@Param("idProducto") Long idProducto);
}
