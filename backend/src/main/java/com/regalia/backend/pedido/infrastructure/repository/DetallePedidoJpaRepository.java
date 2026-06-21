package com.regalia.backend.pedido.infrastructure.repository;

import com.regalia.backend.pedido.infrastructure.entity.DetallePedidoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Repositorio JPA para operaciones sobre la tabla detalle_pedido.
 *
 * Permite consultar las líneas de productos asociadas a un pedido,
 * manteniendo el precio unitario como snapshot histórico del pedido.
 */
public interface DetallePedidoJpaRepository extends JpaRepository<DetallePedidoEntity, Long> {

    List<DetallePedidoEntity> findByPedidoIdPedidoAndEstadoTrueOrderByIdDetallePedidoAsc(Long idPedido);

    /**
     * Obtiene los detalles activos de un pedido junto con el producto asociado.
     *
     * Se usa en la vista del vendedor para evitar consultas adicionales
     * al mapear nombre e identificador del producto.
     */
    @Query("""
            SELECT dp
            FROM DetallePedidoEntity dp
            JOIN FETCH dp.producto p
            WHERE dp.pedido.idPedido = :idPedido
              AND dp.estado = true
            ORDER BY dp.idDetallePedido ASC
            """)
    List<DetallePedidoEntity> buscarDetallesActivosPorPedido(
            @Param("idPedido") Long idPedido
    );
}