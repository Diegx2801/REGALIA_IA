package com.regalia.backend.producto.infrastructure.repository;

import com.regalia.backend.producto.infrastructure.entity.ProductoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla producto.
 */
public interface ProductoJpaRepository extends JpaRepository<ProductoEntity, Long> {

    List<ProductoEntity> findByTiendaIdTiendaAndEstadoTrueOrderByIdProductoAsc(Long idTienda);

    Optional<ProductoEntity> findByIdProductoAndEstadoTrue(Long idProducto);

    boolean existsByTiendaIdTiendaAndNombreIgnoreCaseAndEstadoTrue(Long idTienda, String nombre);

    boolean existsByTiendaIdTiendaAndNombreIgnoreCaseAndEstadoTrueAndIdProductoNot(
            Long idTienda,
            String nombre,
            Long idProducto
    );
}