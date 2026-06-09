package com.regalia.backend.rol.infrastructure.repository;

import com.regalia.backend.rol.infrastructure.entity.RolEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla rol.
 */
public interface RolJpaRepository extends JpaRepository<RolEntity, Long> {

    List<RolEntity> findByEstadoTrueOrderByIdRolAsc();

    Optional<RolEntity> findByNombreIgnoreCaseAndEstadoTrue(String nombre);
}