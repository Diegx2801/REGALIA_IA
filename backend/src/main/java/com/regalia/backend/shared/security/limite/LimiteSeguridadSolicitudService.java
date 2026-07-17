package com.regalia.backend.shared.security.limite;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

/**
 * Gestiona el estado de limites reutilizables. Cada regla y sujeto se actualiza
 * bajo un bloqueo transaccional de PostgreSQL para que el contador sea correcto
 * tambien cuando la aplicacion se ejecute en varias instancias.
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

        String claveSujetoNormalizada = claveSujeto.trim();
        limiteRepository.adquirirBloqueoTransaccional(
                construirClaveBloqueo(clavePolitica, tipoSujeto, claveSujetoNormalizada)
        );

        LocalDateTime ahora = LocalDateTime.now();
        LimiteSeguridadSolicitudEntity limite = limiteRepository
                .findByClavePoliticaAndTipoSujetoAndClaveSujeto(clavePolitica, tipoSujeto, claveSujetoNormalizada)
                .orElseGet(() -> crearLimite(clavePolitica, tipoSujeto, claveSujetoNormalizada, ahora, regla));

        reiniciarVentanaSiExpirada(limite, ahora, regla);
        validarCooldown(limite, ahora, regla);
        validarCuota(limite, regla);

        limite.setCantidadSolicitudes(limite.getCantidadSolicitudes() + 1);
        limite.setFechaUltimaSolicitud(ahora);
        limiteRepository.save(limite);
    }

    private String construirClaveBloqueo(
            PoliticaLimiteSeguridad clavePolitica,
            TipoSujetoLimiteSeguridad tipoSujeto,
            String claveSujeto
    ) {
        return clavePolitica.name() + ':' + tipoSujeto.name() + ':' + claveSujeto;
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
