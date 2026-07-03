package com.regalia.backend.usuario.infrastructure.repository;

import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla usuario.
 */
public interface UsuarioJpaRepository extends JpaRepository<UsuarioEntity, Long> {

    List<UsuarioEntity> findByEstadoTrueOrderByIdUsuarioAsc();

    @Query("""
            SELECT u
            FROM UsuarioEntity u
            WHERE (:estado IS NULL OR u.estado = :estado)
              AND NOT EXISTS (
                  SELECT 1
                  FROM UsuarioRolEntity ur
                  WHERE ur.usuario = u
                    AND ur.estado = true
                    AND UPPER(ur.rol.nombre) = UPPER(:nombreRol)
              )
            ORDER BY u.idUsuario ASC
            """)
    List<UsuarioEntity> findGestionablesSinRolOrderByIdUsuarioAsc(
            @Param("nombreRol") String nombreRol,
            @Param("estado") Boolean estado
    );

    Optional<UsuarioEntity> findByCorreoIgnoreCaseAndEstadoTrue(String correo);

    boolean existsByCorreoIgnoreCase(String correo);

    boolean existsByCorreoIgnoreCaseAndIdUsuarioNot(String correo, Long idUsuario);
}
