package com.regalia.backend.productoimagen.infrastructure.repository;

import com.regalia.backend.productoimagen.infrastructure.entity.ProductoImagenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla producto_imagen.
 */
public interface ProductoImagenJpaRepository extends JpaRepository<ProductoImagenEntity, Long> {

    List<ProductoImagenEntity> findByProductoIdProductoOrderByOrdenAsc(Long idProducto);

    List<ProductoImagenEntity> findByProductoIdProductoAndEstadoTrueOrderByOrdenAsc(Long idProducto);

    Optional<ProductoImagenEntity> findByProductoIdProductoAndOrden(Long idProducto, Integer orden);
}