package com.regalia.backend.productoimagen.infrastructure.repository;

import com.regalia.backend.productoimagen.infrastructure.entity.ProductoImagenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla producto_imagen.
 */
public interface ProductoImagenJpaRepository extends JpaRepository<ProductoImagenEntity, Long> {

    List<ProductoImagenEntity> findByProductoIdProductoOrderByOrdenAsc(Long idProducto);

    List<ProductoImagenEntity> findByProductoIdProductoAndEstadoTrueOrderByOrdenAsc(Long idProducto);

    List<ProductoImagenEntity> findByProductoIdProductoInAndEstadoTrueOrderByProductoIdProductoAscOrdenAsc(
            Collection<Long> idsProducto
    );

    Optional<ProductoImagenEntity> findByProductoIdProductoAndOrden(Long idProducto, Integer orden);

    Optional<ProductoImagenEntity> findByIdProductoImagenAndProductoIdProductoAndEstadoTrue(
            Long idProductoImagen,
            Long idProducto
    );
}
