package com.regalia.backend.shared.security.limite;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

/**
 * Gestiona el estado de limites reutilizables. La coordinacion concurrente del
 * sujeto la realiza el flujo que consume la politica; en reenvios de correo se
 * bloquea la fila de usuario antes de llegar a este servicio.
 */
@Service
@RequiredArgsConstructor
public class LimiteSeguridadSolicitudService {

    private final LimiteSeguridadSolicitudJpaRepository limiteRepository;

    @Transactional(propagation = Propagation.MANDATORY)
    public void registrarSolicitudPermitida(
            PoliticaLimiteSeguridad clavePolitica,
            TipoSujetoLimiteSeguridad tipoSujeto,
            String claveSujeto,
            ReglaLimiteSeguridad regla
    ) {
        if (!StringUtils.hasText(claveSujeto)) {
            throw new IllegalArgumentException("La clave del sujeto es obligatoria");
        }

        LocalDateTime ahora = LocalDateTime.now();
        LimiteSeguridadSolicitudEntity limite = limiteRepository
                .findByClavePoliticaAndTipoSujetoAndClaveSujeto(clavePolitica, tipoSujeto, claveSujeto.trim())
                .orElseGet(() -> crearLimite(clavePolitica, tipoSujeto, claveSujeto.trim(), ahora, regla));

        reiniciarVentanaSiExpirada(limite, ahora, regla);
        validarCooldown(limite, ahora, regla);
        validarCuota(limite, regla);

        limite.setCantidadSolicitudes(limite.getCantidadSolicitudes() + 1);
        limite.setFechaUltimaSolicitud(ahora);
        limiteRepository.save(limite);
    }

    private LimiteSeguridadSolicitudEntity crearLimite(
            PoliticaLimiteSeguridad clavePolitica,
            TipoSujetoLimiteSeguridad tipoSujeto,
            String claveSujeto,
            LocalDateTime ahora,
            ReglaLimiteSeguridad regla
    ) {
        LimiteSeguridadSolicitudEntity limite = new LimiteSeguridadSolicitudEntity();
        limite.setClavePolitica(clavePolitica);
        limite.setTipoSujeto(tipoSujeto);
        limite.setClaveSujeto(claveSujeto);
        limite.setInicioVentana(ahora);
        limite.setCantidadSolicitudes(0);
        limite.setFechaUltimaSolicitud(ahora.minus(regla.cooldown()));
        return limite;
    }

    private void reiniciarVentanaSiExpirada(
            LimiteSeguridadSolicitudEntity limite,
            LocalDateTime ahora,
            ReglaLimiteSeguridad regla
    ) {
        if (!ahora.isBefore(limite.getInicioVentana().plus(regla.duracionVentana()))) {
            limite.setInicioVentana(ahora);
            limite.setCantidadSolicitudes(0);
        }
    }

    private void validarCooldown(
            LimiteSeguridadSolicitudEntity limite,
            LocalDateTime ahora,
            ReglaLimiteSeguridad regla
    ) {
        if (ahora.isBefore(limite.getFechaUltimaSolicitud().plus(regla.cooldown()))) {
            throw new LimiteSeguridadExcedidoException(TipoExcesoLimiteSeguridad.COOLDOWN);
        }
    }

    private void validarCuota(LimiteSeguridadSolicitudEntity limite, ReglaLimiteSeguridad regla) {
        if (limite.getCantidadSolicitudes() >= regla.maximoSolicitudes()) {
            throw new LimiteSeguridadExcedidoException(TipoExcesoLimiteSeguridad.CUOTA);
        }
    }
}
