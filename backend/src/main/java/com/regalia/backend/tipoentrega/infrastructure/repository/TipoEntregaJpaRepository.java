package com.regalia.backend.tipoentrega.infrastructure.repository;

import com.regalia.backend.tipoentrega.infrastructure.entity.TipoEntregaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TipoEntregaJpaRepository extends JpaRepository<TipoEntregaEntity, Long> {

    List<TipoEntregaEntity> findByEstadoTrueOrderByNombreAsc();

    List<TipoEntregaEntity> findAllByOrderByNombreAsc();

    Optional<TipoEntregaEntity> findByIdTipoEntregaAndEstadoTrue(Long idTipoEntrega);

    Optional<TipoEntregaEntity> findByIdTipoEntregaAndEstadoFalse(Long idTipoEntrega);

    boolean existsByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCaseAndIdTipoEntregaNot(String nombre, Long idTipoEntrega);
}
