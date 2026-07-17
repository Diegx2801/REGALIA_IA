package com.regalia.backend.auth.application;

import com.regalia.backend.shared.exception.LimiteReenvioVerificacionException;
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
 * Traduce la politica generica de limites al caso de uso de reenvio de
 * verificacion de correo.
 */
@Service
@RequiredArgsConstructor
public class EmailVerificationResendPolicy {

    private static final ReglaLimiteSeguridad REGLA_REENVIO = new ReglaLimiteSeguridad(
            5,
            Duration.ofHours(24),
            Duration.ofSeconds(60)
    );

    private final LimiteSeguridadSolicitudService limiteSeguridadSolicitudService;

    @Transactional(propagation = Propagation.MANDATORY)
    public void registrarReenvioPermitido(UsuarioEntity usuario) {
        try {
            limiteSeguridadSolicitudService.registrarSolicitudPermitida(
                    PoliticaLimiteSeguridad.REENVIO_VERIFICACION_CORREO,
                    TipoSujetoLimiteSeguridad.USUARIO,
                    String.valueOf(usuario.getIdUsuario()),
                    REGLA_REENVIO
            );
        } catch (LimiteSeguridadExcedidoException ex) {
            throw traducirExceso(ex.getTipoExceso());
        }
    }

    private LimiteReenvioVerificacionException traducirExceso(TipoExcesoLimiteSeguridad tipoExceso) {
        return switch (tipoExceso) {
            case COOLDOWN -> new LimiteReenvioVerificacionException(
                    "Espera al menos 60 segundos antes de solicitar otro correo de verificacion"
            );
            case CUOTA -> new LimiteReenvioVerificacionException(
                    "Alcanzaste el maximo de 5 reenvios de verificacion en 24 horas"
            );
        };
    }
}
