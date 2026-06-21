package com.regalia.backend.pago.infrastructure.repository;

import com.regalia.backend.pago.infrastructure.entity.PagoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

/**
 * Repositorio JPA para operaciones sobre la tabla pago.
 *
 * Los pagos forman parte del historial financiero del pedido.
 */
public interface PagoJpaRepository extends JpaRepository<PagoEntity, Long> {

    boolean existsByCodigoTransaccionIgnoreCaseAndEstadoTrue(String codigoTransaccion);

    List<PagoEntity> findByPedidoIdPedidoAndEstadoTrueOrderByIdPagoAsc(Long idPedido);

    List<PagoEntity> findByPedidoIdPedidoAndEstadoTrueOrderByFechaCreacionAsc(Long idPedido);

    @Query("""
            SELECT COALESCE(SUM(p.monto), 0)
            FROM PagoEntity p
            WHERE p.pedido.idPedido = :idPedido
              AND p.estado = true
              AND p.estadoPago = 'APROBADO'
            """)
    BigDecimal sumarPagosAprobadosPorPedido(@Param("idPedido") Long idPedido);

    /**
     * Obtiene los pagos activos de un pedido junto con el tipo de pago.
     *
     * Se usa en la vista del vendedor para mostrar el historial de pagos
     * sin generar consultas adicionales al acceder a tipoPago.
     */
    @Query("""
            SELECT p
            FROM PagoEntity p
            JOIN FETCH p.tipoPago tp
            WHERE p.pedido.idPedido = :idPedido
              AND p.estado = true
            ORDER BY p.fechaCreacion ASC
            """)
    List<PagoEntity> buscarPagosActivosPorPedido(
            @Param("idPedido") Long idPedido
    );
}