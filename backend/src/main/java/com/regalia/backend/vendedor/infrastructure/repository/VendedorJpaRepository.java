package com.regalia.backend.vendedor.infrastructure.repository;

import com.regalia.backend.vendedor.infrastructure.entity.VendedorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla vendedor.
 */
public interface VendedorJpaRepository extends JpaRepository<VendedorEntity, Long> {

    Optional<VendedorEntity> findByUsuarioCorreoIgnoreCaseAndEstadoTrue(String correo);

    boolean existsByUsuarioIdUsuarioAndEstadoTrue(Long idUsuario);

    @Query("""
            SELECT v
            FROM VendedorEntity v
            WHERE (:estado IS NULL OR v.estado = :estado)
            ORDER BY v.idVendedor ASC
            """)
    List<VendedorEntity> findVendedoresAdministracionPorEstado(
            @Param("estado") Boolean estado
    );

    @Query("""
            SELECT v
            FROM VendedorEntity v
            JOIN v.usuario u
            WHERE (:estado IS NULL OR v.estado = :estado)
              AND (
                  :search IS NULL
                  OR (:searchField = 'NOMBRE' AND LOWER(CONCAT(CONCAT(COALESCE(u.nombre, ''), ' '), COALESCE(u.apellido, ''))) LIKE LOWER(CONCAT('%', :search, '%')))
                  OR (:searchField = 'CORREO' AND LOWER(COALESCE(u.correo, '')) LIKE LOWER(CONCAT('%', :search, '%')))
                  OR (:searchField = 'ID_VENDEDOR' AND v.idVendedor = :searchId)
                  OR (:searchField = 'ID_USUARIO' AND u.idUsuario = :searchId)
              )
            ORDER BY v.idVendedor ASC
            """)
    List<VendedorEntity> findVendedoresAdministracionFiltrados(
            @Param("estado") Boolean estado,
            @Param("searchField") String searchField,
            @Param("search") String search,
            @Param("searchId") Long searchId
    );
}
