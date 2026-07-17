package com.regalia.backend.auth.application;

import com.regalia.backend.auth.application.email.EmailDeliveryService;
import com.regalia.backend.auth.application.result.UsuarioTokenSeguridadCreado;
import com.regalia.backend.auth.infrastructure.email.PasswordRecoveryProperties;
import com.regalia.backend.auth.infrastructure.entity.UsuarioTokenSeguridadEntity;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Orquesta la recuperacion de contrasena para cuentas que poseen acceso local.
 */
@Service
@RequiredArgsConstructor
public class PasswordRecoveryService {

    private final UsuarioJpaRepository usuarioRepository;
    private final UsuarioTokenSeguridadService tokenSeguridadService;
    private final PasswordRecoveryRequestPolicy recoveryRequestPolicy;
    private final PasswordRecoveryProperties properties;
    private final EmailDeliveryService emailDeliveryService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void solicitarRecuperacion(String correo) {
        String correoNormalizado = correo.trim().toLowerCase();
        UsuarioEntity usuario = usuarioRepository.findByCorreoIgnoreCaseAndEstadoTrueForUpdate(correoNormalizado)
                .orElse(null);

        // La respuesta HTTP no distingue inexistencia, cuenta inactiva o cuenta solo Google.
        if (usuario == null || !StringUtils.hasText(usuario.getContrasenaHash())) {
            return;
        }

        recoveryRequestPolicy.registrarSolicitudPermitida(usuario);

        UsuarioTokenSeguridadCreado token = tokenSeguridadService.emitirToken(
                usuario,
                UsuarioTokenSeguridadTipo.PASSWORD_RESET,
                properties.getExpirationMinutes()
        );

        programarEnvio(usuario.getCorreo(), usuario.getNombre(), construirUrlRestablecimiento(token.token()));
    }

    @Transactional
    public void restablecerContrasena(String token, String nuevaContrasena) {
        UsuarioTokenSeguridadEntity tokenConsumido = tokenSeguridadService.consumirToken(
                token,
                UsuarioTokenSeguridadTipo.PASSWORD_RESET
        );

        UsuarioEntity usuario = tokenConsumido.getUsuario();
        if (!Boolean.TRUE.equals(usuario.getEstado())) {
            throw new ReglaNegocioException("No se pudo restablecer la contrasena de esta cuenta");
        }

        usuario.setContrasenaHash(passwordEncoder.encode(nuevaContrasena));
        usuarioRepository.save(usuario);
    }

    private String construirUrlRestablecimiento(String token) {
        return UriComponentsBuilder
                .fromUriString(properties.getResetUrl())
                .fragment("token=" + token)
                .build()
                .toUriString();
    }

    private void programarEnvio(String correo, String nombre, String enlaceRestablecimiento) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            emailDeliveryService.enviarRecuperacionContrasena(correo, nombre, enlaceRestablecimiento);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                emailDeliveryService.enviarRecuperacionContrasena(correo, nombre, enlaceRestablecimiento);
            }
        });
    }
}
