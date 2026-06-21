package com.regalia.backend.politicacomercial.infrastructure.repository;

import com.regalia.backend.politicacomercial.infrastructure.entity.PoliticaComercialEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PoliticaComercialJpaRepository
        extends JpaRepository<PoliticaComercialEntity, Long> {

    Optional<PoliticaComercialEntity> findByCodigoAndEstadoTrue(String codigo);
}