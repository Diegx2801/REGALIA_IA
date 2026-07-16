package com.regalia.backend.auth.application;

import com.regalia.backend.auth.application.email.EmailSender;
import com.regalia.backend.auth.application.result.EmailVerificationResult;
import com.regalia.backend.auth.application.result.UsuarioTokenSeguridadCreado;
import com.regalia.backend.auth.infrastructure.email.EmailVerificationProperties;
import com.regalia.backend.auth.infrastructure.entity.UsuarioTokenSeguridadEntity;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;

/**
 * Orquesta la verificacion de correo para cuentas creadas con login local.
 */
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final UsuarioTokenSeguridadService tokenSeguridadService;
    private final UsuarioJpaRepository usuarioRepository;
    private final EmailSender emailSender;
    private final EmailVerificationProperties properties;

    @Transactional
    public void enviarVerificacionCuentaLocal(UsuarioEntity usuario) {
        if (Boolean.TRUE.equals(usuario.getCorreoVerificado())) {
            return;
        }

        UsuarioTokenSeguridadCreado token = tokenSeguridadService.emitirToken(
                usuario,
                UsuarioTokenSeguridadTipo.EMAIL_VERIFICATION,
                properties.getExpirationMinutes()
        );

        emailSender.enviarVerificacionCorreo(
                usuario.getCorreo(),
                usuario.getNombre(),
                construirUrlConfirmacion(token.token())
        );
    }

    @Transactional
    public EmailVerificationResult confirmarCorreo(String token) {
        UsuarioTokenSeguridadEntity tokenEntity = tokenSeguridadService.consumirToken(
                token,
                UsuarioTokenSeguridadTipo.EMAIL_VERIFICATION
        );

        UsuarioEntity usuario = tokenEntity.getUsuario();
        usuario.setCorreoVerificado(true);
        usuario.setFechaVerificacionCorreo(LocalDateTime.now());

        UsuarioEntity usuarioActualizado = usuarioRepository.save(usuario);

        return new EmailVerificationResult(
                usuarioActualizado.getIdUsuario(),
                usuarioActualizado.getCorreo(),
                Boolean.TRUE.equals(usuarioActualizado.getCorreoVerificado())
        );
    }

    @Transactional
    public EmailVerificationResult reenviarVerificacionCuentaLocal(String correoAutenticado) {
        UsuarioEntity usuario = usuarioRepository.findByCorreoIgnoreCaseAndEstadoTrue(correoAutenticado)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el usuario autenticado"));

        enviarVerificacionCuentaLocal(usuario);

        return new EmailVerificationResult(
                usuario.getIdUsuario(),
                usuario.getCorreo(),
                Boolean.TRUE.equals(usuario.getCorreoVerificado())
        );
    }

    private String construirUrlConfirmacion(String token) {
        return UriComponentsBuilder
                .fromUriString(properties.getConfirmationUrl())
                .queryParam("token", token)
                .build()
                .toUriString();
    }
}
