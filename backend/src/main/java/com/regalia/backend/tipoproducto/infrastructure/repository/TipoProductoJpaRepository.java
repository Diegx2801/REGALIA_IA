package com.regalia.backend.tipoproducto.infrastructure.repository;

import com.regalia.backend.tipoproducto.infrastructure.entity.TipoProductoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla tipo_producto.
 */
public interface TipoProductoJpaRepository extends JpaRepository<TipoProductoEntity, Long> {

    Optional<TipoProductoEntity> findByIdTipoProductoAndEstadoTrue(Long idTipoProducto);

    List<TipoProductoEntity> findByEstadoTrueOrderByIdTipoProductoAsc();
}