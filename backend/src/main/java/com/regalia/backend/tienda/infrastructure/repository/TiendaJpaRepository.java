package com.regalia.backend.tienda.infrastructure.repository;

import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla tienda.
 * SPRING DATA JPA: JpaRepository aporta CRUD base sin escribir SQL manual para operaciones comunes.
 */
public interface TiendaJpaRepository extends JpaRepository<TiendaEntity, Long>, TiendaAdminRepositoryCustom {

    List<TiendaEntity> findByVendedorIdVendedorAndEstadoTrueOrderByIdTiendaAsc(Long idVendedor);

    // JPQL: @Query consulta entidades y campos del modelo Java, no tablas SQL directas.
    @Query("""
            SELECT t
            FROM TiendaEntity t
            WHERE t.estado = true
              AND UPPER(t.estadoRevision) = UPPER(:estadoRevision)
            ORDER BY t.idTienda ASC
            """)
    List<TiendaEntity> findTiendasPublicas(@Param("estadoRevision") String estadoRevision);

    Optional<TiendaEntity> findByIdTiendaAndEstadoTrue(Long idTienda);

    // PARAMETROS NOMBRADOS: @Param une valores Java con nombres legibles dentro de la consulta JPQL.
    @Query("""
            SELECT t
            FROM TiendaEntity t
            WHERE t.idTienda = :idTienda
              AND t.estado = true
              AND UPPER(t.estadoRevision) = UPPER(:estadoRevision)
            """)
    Optional<TiendaEntity> findTiendaPublicaById(
            @Param("idTienda") Long idTienda,
            @Param("estadoRevision") String estadoRevision
    );

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
