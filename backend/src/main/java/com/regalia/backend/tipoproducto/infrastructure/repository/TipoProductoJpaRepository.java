package com.regalia.backend.tipoproducto.infrastructure.repository;

import com.regalia.backend.tipoproducto.infrastructure.entity.TipoProductoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TipoProductoJpaRepository extends JpaRepository<TipoProductoEntity, Long> {

    List<TipoProductoEntity> findByEstadoTrueOrderByNombreAsc();

    Optional<TipoProductoEntity> findByIdTipoProductoAndEstadoTrue(Long idTipoProducto);

    Optional<TipoProductoEntity> findByIdTipoProductoAndEstadoFalse(Long idTipoProducto);

    boolean existsByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCaseAndIdTipoProductoNot(String nombre, Long idTipoProducto);
}