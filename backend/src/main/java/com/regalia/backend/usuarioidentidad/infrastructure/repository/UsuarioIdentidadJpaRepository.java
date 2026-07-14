package com.regalia.backend.usuarioidentidad.infrastructure.repository;

import com.regalia.backend.usuarioidentidad.infrastructure.entity.UsuarioIdentidadEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repositorio para identidades externas usadas por SSO.
 */
public interface UsuarioIdentidadJpaRepository extends JpaRepository<UsuarioIdentidadEntity, Long> {

    Optional<UsuarioIdentidadEntity> findByProveedorAndProveedorSubjectAndEstadoTrue(
            String proveedor,
            String proveedorSubject
    );

    boolean existsByUsuario_IdUsuarioAndProveedorAndEstadoTrue(Long idUsuario, String proveedor);
}
