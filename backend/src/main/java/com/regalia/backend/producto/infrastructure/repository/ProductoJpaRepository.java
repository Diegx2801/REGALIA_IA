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

    /**
     * Una ficha sin imagen confirmada sigue siendo editable para su vendedor,
     * pero no representa una oferta comercial completa para clientes.
     */
    @Query("""
            SELECT p
            FROM ProductoEntity p
            WHERE p.tienda.idTienda = :idTienda
            AND p.estado = true
            AND p.visibleEnTienda = true
            AND EXISTS (
                SELECT 1
                FROM ProductoImagenEntity pi
                WHERE pi.producto = p
                AND pi.estado = true
            )
            ORDER BY p.idProducto ASC
            """)
    List<ProductoEntity> findProductosPublicosDeTiendaConImagenActiva(
            @Param("idTienda") Long idTienda
    );

    Optional<ProductoEntity> findByIdProductoAndEstadoTrue(Long idProducto);

    /** Consulta de detalle público alineada con el catálogo y la vitrina de tienda. */
    @Query("""
            SELECT p
            FROM ProductoEntity p
            JOIN FETCH p.tienda t
            WHERE p.idProducto = :idProducto
            AND p.estado = true
            AND p.visibleEnTienda = true
            AND EXISTS (
                SELECT 1
                FROM ProductoImagenEntity pi
                WHERE pi.producto = p
                AND pi.estado = true
            )
            """)
    Optional<ProductoEntity> findProductoPublicoConImagenActiva(
            @Param("idProducto") Long idProducto
    );

    boolean existsByTiendaIdTiendaAndNombreIgnoreCaseAndEstadoTrue(Long idTienda, String nombre);

    boolean existsByTiendaIdTiendaAndNombreIgnoreCaseAndEstadoTrueAndIdProductoNot(
            Long idTienda,
            String nombre,
            Long idProducto
    );

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
