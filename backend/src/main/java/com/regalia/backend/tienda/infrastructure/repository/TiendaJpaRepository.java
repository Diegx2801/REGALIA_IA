package com.regalia.backend.tienda.infrastructure.repository;

import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla tienda.
 */
public interface TiendaJpaRepository extends JpaRepository<TiendaEntity, Long> {

    List<TiendaEntity> findByVendedorIdVendedorAndEstadoTrueOrderByIdTiendaAsc(Long idVendedor);

    List<TiendaEntity> findByEstadoTrueAndEstadoRevisionNotOrderByIdTiendaAsc(String estadoRevision);

    Optional<TiendaEntity> findByIdTiendaAndEstadoTrue(Long idTienda);

    Optional<TiendaEntity> findByIdTiendaAndEstadoTrueAndEstadoRevisionNot(Long idTienda, String estadoRevision);

    long countByVendedorIdVendedorAndEstadoTrue(Long idVendedor);

    long countByVendedorIdVendedor(Long idVendedor);

    @Query("""
            SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END
            FROM TiendaEntity t
            JOIN t.vendedor v
            JOIN v.usuario u
            WHERE t.idTienda = :idTienda
              AND u.idUsuario = :idUsuario
              AND t.estado = true
            """)
    boolean existsTiendaPropiaDeUsuario(
            @Param("idTienda") Long idTienda,
            @Param("idUsuario") Long idUsuario
    );
}