package com.regalia.backend.comision.infrastructure.repository;

import com.regalia.backend.comision.infrastructure.entity.ComisionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla comision.
 */
public interface ComisionJpaRepository extends JpaRepository<ComisionEntity, Long> {

    Optional<ComisionEntity> findByPagoIdPagoAndEstadoTrue(Long idPago);
}