package com.regalia.backend.rubro.infrastructure.repository;

import com.regalia.backend.rubro.infrastructure.entity.RubroEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla rubro.
 */
public interface RubroJpaRepository extends JpaRepository<RubroEntity, Long> {

    List<RubroEntity> findByEstadoTrueOrderByIdRubroAsc();

    List<RubroEntity> findByIdRubroInAndEstadoTrue(List<Long> idsRubros);

    Optional<RubroEntity> findByIdRubroAndEstadoTrue(Long idRubro);

    boolean existsByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCaseAndIdRubroNot(String nombre, Long idRubro);
}