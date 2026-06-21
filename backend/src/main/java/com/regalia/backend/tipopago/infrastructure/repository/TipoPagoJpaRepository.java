package com.regalia.backend.tipopago.infrastructure.repository;

import com.regalia.backend.tipopago.infrastructure.entity.TipoPagoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla tipo_pago.
 */
public interface TipoPagoJpaRepository extends JpaRepository<TipoPagoEntity, Long> {

    List<TipoPagoEntity> findByEstadoTrueOrderByIdTipoPagoAsc();

    Optional<TipoPagoEntity> findByIdTipoPagoAndEstadoTrue(Long idTipoPago);

    Optional<TipoPagoEntity> findByCodigoAndEstadoTrue(String codigo);

    boolean existsByNombreIgnoreCaseAndIdTipoPagoNot(String nombre, Long idTipoPago);
}