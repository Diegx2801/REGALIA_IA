package com.regalia.backend.pedidocumplimiento.infrastructure.repository;

import com.regalia.backend.pedidocumplimiento.infrastructure.entity.PedidoCumplimientoEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/** Repositorio del cumplimiento unico asociado a cada pedido del MVP. */
public interface PedidoCumplimientoJpaRepository extends JpaRepository<PedidoCumplimientoEntity, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT cumplimiento
            FROM PedidoCumplimientoEntity cumplimiento
            WHERE cumplimiento.pedido.idPedido = :idPedido
            """)
    Optional<PedidoCumplimientoEntity> findByPedidoIdPedidoForUpdate(@Param("idPedido") Long idPedido);
}
