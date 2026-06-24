package com.regalia.backend.pedido.infrastructure.repository;

import com.regalia.backend.pedido.infrastructure.entity.PedidoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla pedido.
 *
 * Contiene consultas para el contexto del cliente, administrador
 * y vendedor. Las consultas del vendedor validan la propiedad del pedido
 * mediante la relación pedido -> tienda -> vendedor -> usuario.
 */
public interface PedidoJpaRepository extends JpaRepository<PedidoEntity, Long> {

    List<PedidoEntity> findByUsuarioIdUsuarioAndEstadoTrueOrderByIdPedidoDesc(Long idUsuario);

    Optional<PedidoEntity> findByIdPedidoAndUsuarioIdUsuarioAndEstadoTrue(
            Long idPedido,
            Long idUsuario
    );

    List<PedidoEntity> findByEstadoTrueOrderByIdPedidoDesc();

    Optional<PedidoEntity> findByIdPedidoAndEstadoTrue(Long idPedido);

    /**
     * Lista los pedidos recibidos en todas las tiendas del vendedor autenticado.
     *
     * La relación de seguridad se valida por:
     * pedido -> tienda -> vendedor -> usuario.
     */
    @Query("""
            SELECT p
            FROM PedidoEntity p
            JOIN FETCH p.usuario u
            JOIN FETCH p.tienda t
            JOIN FETCH t.vendedor v
            JOIN FETCH v.usuario vu
            JOIN FETCH p.tipoEntrega te
            WHERE vu.correo = :correoVendedor
              AND p.estado = true
            ORDER BY p.fechaCreacion DESC
            """)
    List<PedidoEntity> listarPedidosRecibidosPorVendedor(
            @Param("correoVendedor") String correoVendedor
    );

    /**
     * Lista los pedidos recibidos en una tienda específica, siempre que
     * dicha tienda pertenezca al vendedor autenticado.
     */
    @Query("""
            SELECT p
            FROM PedidoEntity p
            JOIN FETCH p.usuario u
            JOIN FETCH p.tienda t
            JOIN FETCH t.vendedor v
            JOIN FETCH v.usuario vu
            JOIN FETCH p.tipoEntrega te
            WHERE vu.correo = :correoVendedor
              AND t.idTienda = :idTienda
              AND p.estado = true
            ORDER BY p.fechaCreacion DESC
            """)
    List<PedidoEntity> listarPedidosRecibidosPorTiendaDelVendedor(
            @Param("correoVendedor") String correoVendedor,
            @Param("idTienda") Long idTienda
    );

    /**
     * Busca un pedido recibido por el vendedor autenticado.
     *
     * Si el pedido existe pero pertenece a otra tienda/vendedor,
     * no se devuelve resultado. Esto evita exponer pedidos ajenos.
     */
    @Query("""
            SELECT p
            FROM PedidoEntity p
            JOIN FETCH p.usuario u
            JOIN FETCH p.tienda t
            JOIN FETCH t.vendedor v
            JOIN FETCH v.usuario vu
            JOIN FETCH p.tipoEntrega te
            WHERE vu.correo = :correoVendedor
              AND p.idPedido = :idPedido
              AND p.estado = true
            """)
    Optional<PedidoEntity> buscarPedidoRecibidoPorVendedor(
            @Param("correoVendedor") String correoVendedor,
            @Param("idPedido") Long idPedido
    );
}