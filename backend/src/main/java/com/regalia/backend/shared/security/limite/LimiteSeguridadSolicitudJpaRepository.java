package com.regalia.backend.shared.security.limite;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface LimiteSeguridadSolicitudJpaRepository
        extends JpaRepository<LimiteSeguridadSolicitudEntity, Long> {

    Optional<LimiteSeguridadSolicitudEntity> findByClavePoliticaAndTipoSujetoAndClaveSujeto(
            PoliticaLimiteSeguridad clavePolitica,
            TipoSujetoLimiteSeguridad tipoSujeto,
            String claveSujeto
    );

    /**
     * Serializa la actualizacion de una misma regla y sujeto entre instancias
     * de la aplicacion. PostgreSQL libera este bloqueo al terminar la
     * transaccion.
     */
    @Query(value = """
            SELECT 1
            FROM (SELECT pg_advisory_xact_lock(hashtext(:claveBloqueo))) AS bloqueo
            """, nativeQuery = true)
    Integer adquirirBloqueoTransaccional(@Param("claveBloqueo") String claveBloqueo);
}
