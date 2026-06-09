package com.regalia.backend.usuariorol.infrastructure.repository;

import com.regalia.backend.usuariorol.infrastructure.entity.UsuarioRolEntity;
import com.regalia.backend.usuariorol.infrastructure.entity.UsuarioRolId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repositorio JPA para operaciones sobre la tabla usuario_rol.
 */
public interface UsuarioRolJpaRepository extends JpaRepository<UsuarioRolEntity, UsuarioRolId> {

    List<UsuarioRolEntity> findByUsuarioIdUsuarioAndEstadoTrue(Long idUsuario);

    boolean existsByUsuarioIdUsuarioAndRolIdRolAndEstadoTrue(Long idUsuario, Long idRol);
}