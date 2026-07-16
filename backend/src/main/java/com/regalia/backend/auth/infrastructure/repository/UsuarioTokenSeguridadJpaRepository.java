package com.regalia.backend.auth.infrastructure.repository;

import com.regalia.backend.auth.application.UsuarioTokenSeguridadTipo;
import com.regalia.backend.auth.infrastructure.entity.UsuarioTokenSeguridadEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UsuarioTokenSeguridadJpaRepository extends JpaRepository<UsuarioTokenSeguridadEntity, Long> {

    Optional<UsuarioTokenSeguridadEntity> findByTokenHashAndTipoTokenAndEstadoTrue(
            String tokenHash,
            UsuarioTokenSeguridadTipo tipoToken
    );

    Optional<UsuarioTokenSeguridadEntity> findByTokenHashAndTipoToken(
            String tokenHash,
            UsuarioTokenSeguridadTipo tipoToken
    );

    @Modifying(flushAutomatically = true)
    @Query("""
            update UsuarioTokenSeguridadEntity token
            set token.fechaConsumo = :fechaConsumo,
                token.estado = false
            where token.tokenHash = :tokenHash
              and token.tipoToken = :tipoToken
              and token.estado = true
              and token.fechaConsumo is null
              and token.fechaExpiracion > :fechaConsumo
            """)
    int consumirAtomico(
            @Param("tokenHash") String tokenHash,
            @Param("tipoToken") UsuarioTokenSeguridadTipo tipoToken,
            @Param("fechaConsumo") LocalDateTime fechaConsumo
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
