package com.regalia.backend.pedido.infrastructure.repository;

import com.regalia.backend.pedido.infrastructure.entity.PedidoEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * Repositorio JPA de pedidos. Las consultas privadas de vendedor validan la
 * propiedad mediante pedido, tienda, vendedor y usuario autenticado.
 */
public interface PedidoJpaRepository extends JpaRepository<PedidoEntity, Long>,
        PedidoAdminRepositoryCustom,
        PedidoClienteRepositoryCustom,
        PedidoVendedorRepositoryCustom {

    Optional<PedidoEntity> findByIdPedidoAndUsuarioIdUsuarioAndEstadoTrue(
            Long idPedido,
            Long idUsuario
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p
            FROM PedidoEntity p
            WHERE p.idPedido = :idPedido
              AND p.usuario.idUsuario = :idUsuario
              AND p.estado = true
            """)
    Optional<PedidoEntity> findMiPedidoActivoParaActualizar(
            @Param("idPedido") Long idPedido,
            @Param("idUsuario") Long idUsuario
    );

    Optional<PedidoEntity> findByIdPedidoAndEstadoTrue(Long idPedido);

    /**
     * Bloquea un pedido activo durante transiciones automaticas disparadas por
     * una confirmacion de pago. No expone este acceso a usuarios finales.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p
            FROM PedidoEntity p
            JOIN FETCH p.usuario
            JOIN FETCH p.tienda tienda
            JOIN FETCH tienda.vendedor vendedor
            JOIN FETCH vendedor.usuario
            WHERE p.idPedido = :idPedido
              AND p.estado = true
            """)
    Optional<PedidoEntity> findActivoPorIdParaActualizar(@Param("idPedido") Long idPedido);

    /**
     * Devuelve pedido solo si pertenece al vendedor autenticado. Un pedido de
     * otro vendedor no se distingue de uno inexistente.
     */
    @Query("""
            SELECT p
            FROM PedidoEntity p
            JOIN FETCH p.usuario cliente
            JOIN FETCH p.tienda tienda
            JOIN FETCH tienda.vendedor vendedor
            JOIN FETCH vendedor.usuario usuarioVendedor
            JOIN FETCH p.tipoEntrega tipoEntrega
            WHERE usuarioVendedor.correo = :correoVendedor
              AND p.idPedido = :idPedido
              AND p.estado = true
            """)
    Optional<PedidoEntity> buscarPedidoRecibidoPorVendedor(
            @Param("correoVendedor") String correoVendedor,
            @Param("idPedido") Long idPedido
    );

    /**
     * Bloquea el pedido solo si pertenece al vendedor autenticado. La condicion
     * de propiedad evita revelar pedidos ajenos durante cambios de estado.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p
            FROM PedidoEntity p
            JOIN FETCH p.usuario cliente
            JOIN FETCH p.tienda tienda
            JOIN FETCH tienda.vendedor vendedor
            JOIN FETCH vendedor.usuario usuarioVendedor
            WHERE usuarioVendedor.correo = :correoVendedor
              AND p.idPedido = :idPedido
              AND p.estado = true
            """)
    Optional<PedidoEntity> buscarPedidoRecibidoPorVendedorParaActualizar(
            @Param("correoVendedor") String correoVendedor,
            @Param("idPedido") Long idPedido
    );
}
