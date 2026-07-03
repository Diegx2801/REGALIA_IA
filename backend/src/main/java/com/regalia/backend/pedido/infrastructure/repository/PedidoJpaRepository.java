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

    Optional<PedidoEntity> findByIdPedidoAndEstadoTrue(Long idPedido);

    List<PedidoEntity> findByEstadoTrueOrderByIdPedidoDesc();

    @Query("""
            SELECT p
            FROM PedidoEntity p
            JOIN p.tienda t
            JOIN p.usuario u
            WHERE p.estado = true
              AND (
                  :search IS NULL
                  OR (:searchField = 'ID_PEDIDO' AND p.idPedido = :searchId)
                  OR (:searchField = 'NOMBRE_TIENDA' AND LOWER(COALESCE(t.nombre, '')) LIKE LOWER(CONCAT('%', :search, '%')))
                  OR (:searchField = 'ID_USUARIO' AND u.idUsuario = :searchId)
                  OR (:searchField = 'ID_TIENDA' AND t.idTienda = :searchId)
                  OR (:searchField = 'ESTADO_PEDIDO' AND LOWER(COALESCE(p.estadoPedido, '')) LIKE LOWER(CONCAT('%', :search, '%')))
              )
            ORDER BY p.idPedido DESC
            """)
    List<PedidoEntity> findPedidosAdministracionFiltrados(
            @Param("searchField") String searchField,
            @Param("search") String search,
            @Param("searchId") Long searchId
    );

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
