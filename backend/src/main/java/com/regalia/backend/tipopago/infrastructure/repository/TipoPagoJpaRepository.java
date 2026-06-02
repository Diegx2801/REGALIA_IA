package com.regalia.backend.tipopago.infrastructure.repository;

import com.regalia.backend.tipopago.infrastructure.entity.TipoPagoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repositorio JPA para operaciones sobre la tabla tipo_pago.
 */
public interface TipoPagoJpaRepository extends JpaRepository<TipoPagoEntity, Long> {

    boolean existsByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCaseAndIdTipoPagoNot(String nombre, Long idTipoPago);

    List<TipoPagoEntity> findByEstadoTrueOrderByIdTipoPagoAsc();
}