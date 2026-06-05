package com.regalia.backend.usuario.infrastructure.repository;

import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla usuario.
 */
public interface UsuarioJpaRepository extends JpaRepository<UsuarioEntity, Long> {

    List<UsuarioEntity> findByEstadoTrueOrderByIdUsuarioAsc();

    Optional<UsuarioEntity> findByCorreoIgnoreCaseAndEstadoTrue(String correo);

    boolean existsByCorreoIgnoreCase(String correo);

    boolean existsByCorreoIgnoreCaseAndIdUsuarioNot(String correo, Long idUsuario);
}