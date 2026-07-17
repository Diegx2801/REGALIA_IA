package com.regalia.backend.auth.application;

import com.regalia.backend.shared.exception.LimiteSolicitudSeguridadException;
import com.regalia.backend.shared.security.limite.LimiteSeguridadExcedidoException;
import com.regalia.backend.shared.security.limite.LimiteSeguridadSolicitudService;
import com.regalia.backend.shared.security.limite.PoliticaLimiteSeguridad;
import com.regalia.backend.shared.security.limite.ReglaLimiteSeguridad;
import com.regalia.backend.shared.security.limite.TipoExcesoLimiteSeguridad;
import com.regalia.backend.shared.security.limite.TipoSujetoLimiteSeguridad;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

/**
 * Aplica limites complementarios a la recuperacion de contrasena: una espera
 * corta por cuenta y una cuota diaria por IP.
 */
@Service
@RequiredArgsConstructor
public class PasswordRecoveryRequestPolicy {

    private static final ReglaLimiteSeguridad REGLA_USUARIO = new ReglaLimiteSeguridad(
            1,
            Duration.ofSeconds(60),
            Duration.ofSeconds(60)
    );

    private static final ReglaLimiteSeguridad REGLA_IP = new ReglaLimiteSeguridad(
            5,
            Duration.ofHours(24),
            Duration.ZERO
    );

    private final LimiteSeguridadSolicitudService limiteSeguridadSolicitudService;

    @Transactional(propagation = Propagation.MANDATORY)
    public void registrarSolicitudPermitidaDesdeIp(String ip) {
        try {
            limiteSeguridadSolicitudService.registrarSolicitudPermitida(
                    PoliticaLimiteSeguridad.SOLICITUD_RECUPERACION_CONTRASENA,
                    TipoSujetoLimiteSeguridad.IP,
                    ip,
                    REGLA_IP
            );
        } catch (LimiteSeguridadExcedidoException exception) {
            throw new LimiteSolicitudSeguridadException(
                    "No podemos procesar esta solicitud en este momento. Intentalo mas tarde"
            );
        }
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void registrarSolicitudPermitidaPorUsuario(UsuarioEntity usuario) {
        try {
            limiteSeguridadSolicitudService.registrarSolicitudPermitida(
                    PoliticaLimiteSeguridad.SOLICITUD_RECUPERACION_CONTRASENA,
                    TipoSujetoLimiteSeguridad.USUARIO,
                    String.valueOf(usuario.getIdUsuario()),
                    REGLA_USUARIO
            );
        } catch (LimiteSeguridadExcedidoException exception) {
            throw traducirExcesoUsuario(exception.getTipoExceso());
        }
    }

    private LimiteSolicitudSeguridadException traducirExcesoUsuario(TipoExcesoLimiteSeguridad tipoExceso) {
        return switch (tipoExceso) {
            case COOLDOWN -> new LimiteSolicitudSeguridadException(
                    "Espera un momento antes de solicitar otro correo de recuperacion de contrasena"
            );
            case CUOTA -> new LimiteSolicitudSeguridadException(
                    "Espera un momento antes de solicitar otro correo de recuperacion de contrasena"
            );
        };
    }
}
