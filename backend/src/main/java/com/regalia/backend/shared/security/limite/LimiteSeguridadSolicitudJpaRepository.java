package com.regalia.backend.shared.security.limite;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LimiteSeguridadSolicitudJpaRepository
        extends JpaRepository<LimiteSeguridadSolicitudEntity, Long> {

    Optional<LimiteSeguridadSolicitudEntity> findByClavePoliticaAndTipoSujetoAndClaveSujeto(
            PoliticaLimiteSeguridad clavePolitica,
            TipoSujetoLimiteSeguridad tipoSujeto,
            String claveSujeto
    );
}
