package com.regalia.backend.auditoria.infrastructure.repository;

import com.regalia.backend.auditoria.infrastructure.entity.AuditoriaEventoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditoriaEventoJpaRepository extends JpaRepository<AuditoriaEventoEntity, Long> {
}
