package com.regalia.backend.checkout.infrastructure.repository;

import com.regalia.backend.checkout.infrastructure.entity.CheckoutSessionEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CheckoutSessionJpaRepository extends JpaRepository<CheckoutSessionEntity, Long> {

    Optional<CheckoutSessionEntity> findByPaymentIdAndEstadoTrue(String paymentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT session
            FROM CheckoutSessionEntity session
            WHERE session.externalReference = :externalReference
              AND session.estado = true
            """)
    Optional<CheckoutSessionEntity> findActivaPorExternalReferenceParaActualizar(
            @Param("externalReference") String externalReference
    );

    @Query("""
            SELECT DISTINCT session
            FROM CheckoutSessionEntity session
            JOIN FETCH session.usuario usuario
            JOIN FETCH session.tienda tienda
            JOIN FETCH session.tipoEntrega tipoEntrega
            JOIN FETCH session.tipoPago tipoPago
            LEFT JOIN FETCH session.pedido pedido
            LEFT JOIN FETCH session.items item
            LEFT JOIN FETCH item.producto producto
            WHERE session.externalReference = :externalReference
              AND session.estado = true
            """)
    Optional<CheckoutSessionEntity> findActivaPorExternalReferenceConDetalle(
            @Param("externalReference") String externalReference
    );
}
