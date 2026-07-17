package com.regalia.backend.usuario.infrastructure.repository;

import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla usuario.
 */
public interface UsuarioJpaRepository extends JpaRepository<UsuarioEntity, Long>, UsuarioAdminRepositoryCustom {

    List<UsuarioEntity> findByEstadoTrueOrderByIdUsuarioAsc();

    Optional<UsuarioEntity> findByCorreoIgnoreCaseAndEstadoTrue(String correo);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select usuario from UsuarioEntity usuario where usuario.idUsuario = :idUsuario")
    Optional<UsuarioEntity> findByIdForUpdate(@Param("idUsuario") Long idUsuario);

    @Query("""
            select usuario.estado as estado, usuario.versionAutenticacion as versionAutenticacion
            from UsuarioEntity usuario
            where usuario.idUsuario = :idUsuario
            """)
    Optional<UsuarioEstadoAutenticacionProjection> findEstadoAutenticacionByIdUsuario(
            @Param("idUsuario") Long idUsuario
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select usuario
            from UsuarioEntity usuario
            where lower(usuario.correo) = lower(:correo)
              and usuario.estado = true
            """)
    Optional<UsuarioEntity> findByCorreoIgnoreCaseAndEstadoTrueForUpdate(@Param("correo") String correo);

    boolean existsByCorreoIgnoreCase(String correo);

    boolean existsByCorreoIgnoreCaseAndIdUsuarioNot(String correo, Long idUsuario);
}
