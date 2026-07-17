package com.regalia.backend.auth.application;

import com.regalia.backend.shared.exception.LimiteSolicitudSeguridadException;
import com.regalia.backend.shared.security.limite.LimiteSeguridadExcedidoException;
import com.regalia.backend.shared.security.limite.LimiteSeguridadSolicitudService;
import com.regalia.backend.shared.security.limite.PoliticaLimiteSeguridad;
import com.regalia.backend.shared.security.limite.ReglaLimiteSeguridad;
import com.regalia.backend.shared.security.limite.TipoSujetoLimiteSeguridad;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

/**
 * Limita los correos de recuperacion emitidos por una cuenta local.
 */
@Service
@RequiredArgsConstructor
public class PasswordRecoveryRequestPolicy {

    private static final ReglaLimiteSeguridad REGLA_RECUPERACION = new ReglaLimiteSeguridad(
            5,
            Duration.ofHours(24),
            Duration.ofSeconds(60)
    );

    private final LimiteSeguridadSolicitudService limiteSeguridadSolicitudService;

    @Transactional(propagation = Propagation.MANDATORY)
    public void registrarSolicitudPermitida(UsuarioEntity usuario) {
        try {
            limiteSeguridadSolicitudService.registrarSolicitudPermitida(
                    PoliticaLimiteSeguridad.SOLICITUD_RECUPERACION_CONTRASENA,
                    TipoSujetoLimiteSeguridad.USUARIO,
                    String.valueOf(usuario.getIdUsuario()),
                    REGLA_RECUPERACION
            );
        } catch (LimiteSeguridadExcedidoException exception) {
            throw new LimiteSolicitudSeguridadException(
                    "Espera antes de solicitar otro correo de recuperacion de contrasena"
            );
        }
    }
}
