package com.regalia.backend.auth.application;

import com.regalia.backend.auth.application.result.UsuarioTokenSeguridadCreado;
import com.regalia.backend.auth.infrastructure.entity.UsuarioTokenSeguridadEntity;
import com.regalia.backend.auth.infrastructure.repository.UsuarioTokenSeguridadJpaRepository;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

/**
 * Gestiona tokens de seguridad de usuario almacenando solo hashes en base de datos.
 */
@Service
@RequiredArgsConstructor
public class UsuarioTokenSeguridadService {

    private static final int TOKEN_BYTES = 32;
    private static final String HASH_ALGORITHM = "SHA-256";
    private static final String MENSAJE_TOKEN_INVALIDO = "El enlace de verificacion no es valido o expiro";

    private final UsuarioTokenSeguridadJpaRepository tokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional(propagation = Propagation.MANDATORY)
    public UsuarioTokenSeguridadCreado emitirToken(
            UsuarioEntity usuario,
            UsuarioTokenSeguridadTipo tipoToken,
            int duracionMinutos
    ) {
        invalidarTokensActivos(usuario.getIdUsuario(), tipoToken);

        String token = generarToken();
        UsuarioTokenSeguridadEntity entity = new UsuarioTokenSeguridadEntity();
        entity.setUsuario(usuario);
        entity.setTipoToken(tipoToken);
        entity.setTokenHash(hashearToken(token));
        entity.setFechaExpiracion(LocalDateTime.now().plusMinutes(duracionMinutos));
        entity.setEstado(true);

        UsuarioTokenSeguridadEntity tokenGuardado = tokenRepository.save(entity);

        return new UsuarioTokenSeguridadCreado(token, tokenGuardado.getFechaExpiracion());
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public UsuarioTokenSeguridadEntity consumirToken(String token, UsuarioTokenSeguridadTipo tipoToken) {
        if (token == null || token.isBlank()) {
            throw new ReglaNegocioException(MENSAJE_TOKEN_INVALIDO);
        }

        String tokenHash = hashearToken(token.trim());
        LocalDateTime fechaConsumo = LocalDateTime.now();
        int tokensConsumidos = tokenRepository.consumirAtomico(tokenHash, tipoToken, fechaConsumo);

        if (tokensConsumidos != 1) {
            throw new ReglaNegocioException(MENSAJE_TOKEN_INVALIDO);
        }

        return tokenRepository.findByTokenHashAndTipoToken(tokenHash, tipoToken)
                .orElseThrow(() -> new IllegalStateException("No se encontro el token consumido"));
    }

    private void invalidarTokensActivos(Long idUsuario, UsuarioTokenSeguridadTipo tipoToken) {
        tokenRepository.findByUsuario_IdUsuarioAndTipoTokenAndEstadoTrue(idUsuario, tipoToken)
                .forEach(token -> {
                    token.setEstado(false);
                    tokenRepository.save(token);
                });
    }

    private String generarToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private String hashearToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance(HASH_ALGORITHM);
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));

            StringBuilder builder = new StringBuilder(hash.length * 2);
            for (byte value : hash) {
                builder.append(String.format("%02x", value & 0xff));
            }

            return builder.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("No se pudo inicializar el hash de tokens", exception);
        }
    }
}
