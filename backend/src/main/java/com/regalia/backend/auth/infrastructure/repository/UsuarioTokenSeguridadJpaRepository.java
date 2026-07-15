package com.regalia.backend.auth.infrastructure.repository;

import com.regalia.backend.auth.application.UsuarioTokenSeguridadTipo;
import com.regalia.backend.auth.infrastructure.entity.UsuarioTokenSeguridadEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioTokenSeguridadJpaRepository extends JpaRepository<UsuarioTokenSeguridadEntity, Long> {

    Optional<UsuarioTokenSeguridadEntity> findByTokenHashAndTipoTokenAndEstadoTrue(
            String tokenHash,
            UsuarioTokenSeguridadTipo tipoToken
    );

    boolean existsByUsuario_IdUsuarioAndTipoTokenAndEstadoTrue(
            Long idUsuario,
            UsuarioTokenSeguridadTipo tipoToken
    );

    List<UsuarioTokenSeguridadEntity> findByUsuario_IdUsuarioAndTipoTokenAndEstadoTrue(
            Long idUsuario,
            UsuarioTokenSeguridadTipo tipoToken
    );
}
