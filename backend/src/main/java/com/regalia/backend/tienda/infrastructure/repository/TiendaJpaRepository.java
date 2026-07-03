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

    List<TiendaEntity> findByEstadoTrueOrderByIdTiendaAsc();

    @Query("""
            SELECT t
            FROM TiendaEntity t
            WHERE t.estado = true
              AND (:estadoRevision IS NULL OR UPPER(t.estadoRevision) = UPPER(:estadoRevision))
            ORDER BY t.idTienda ASC
            """)
    List<TiendaEntity> findTiendasAdministracionPorEstado(
            @Param("estadoRevision") String estadoRevision
    );

    @Query("""
            SELECT t
            FROM TiendaEntity t
            JOIN t.vendedor v
            JOIN v.usuario u
            WHERE t.estado = true
              AND (:estadoRevision IS NULL OR UPPER(t.estadoRevision) = UPPER(:estadoRevision))
              AND (
                  :search IS NULL
                  OR (:searchField = 'NOMBRE' AND LOWER(COALESCE(t.nombre, '')) LIKE LOWER(CONCAT('%', :search, '%')))
                  OR (:searchField = 'VENDEDOR' AND LOWER(CONCAT(CONCAT(COALESCE(u.nombre, ''), ' '), COALESCE(u.apellido, ''))) LIKE LOWER(CONCAT('%', :search, '%')))
                  OR (:searchField = 'CORREO_VENDEDOR' AND LOWER(COALESCE(u.correo, '')) LIKE LOWER(CONCAT('%', :search, '%')))
                  OR (:searchField = 'ID_TIENDA' AND t.idTienda = :searchId)
              )
            ORDER BY t.idTienda ASC
            """)
    List<TiendaEntity> findTiendasAdministracionFiltradas(
            @Param("estadoRevision") String estadoRevision,
            @Param("searchField") String searchField,
            @Param("search") String search,
            @Param("searchId") Long searchId
    );

    @Query("""
            SELECT t
            FROM TiendaEntity t
            WHERE t.estado = true
              AND UPPER(t.estadoRevision) = UPPER(:estadoRevision)
            ORDER BY t.idTienda ASC
            """)
    List<TiendaEntity> findTiendasPublicas(@Param("estadoRevision") String estadoRevision);

    Optional<TiendaEntity> findByIdTiendaAndEstadoTrue(Long idTienda);

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
