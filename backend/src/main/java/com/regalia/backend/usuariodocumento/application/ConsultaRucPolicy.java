package com.regalia.backend.usuariodocumento.application;

import com.regalia.backend.shared.exception.LimiteSolicitudSeguridadException;
import com.regalia.backend.shared.security.limite.LimiteSeguridadExcedidoException;
import com.regalia.backend.shared.security.limite.LimiteSeguridadSolicitudService;
import com.regalia.backend.shared.security.limite.PoliticaLimiteSeguridad;
import com.regalia.backend.shared.security.limite.ReglaLimiteSeguridad;
import com.regalia.backend.shared.security.limite.TipoExcesoLimiteSeguridad;
import com.regalia.backend.shared.security.limite.TipoSujetoLimiteSeguridad;
import com.regalia.backend.usuariodocumento.infrastructure.client.ApisPeruRucProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Aplica la cuota global del token de consultas RUC de APIS Perú. */
@Service
@RequiredArgsConstructor
public class ConsultaRucPolicy {

    private static final String CLAVE_PROVEEDOR = "APISPERU_RUC";

    private final LimiteSeguridadSolicitudService limiteSeguridadSolicitudService;
    private final ApisPeruRucProperties properties;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarConsultaPermitida() {
        try {
            limiteSeguridadSolicitudService.registrarSolicitudPermitida(
                    PoliticaLimiteSeguridad.CONSULTA_RUC,
                    TipoSujetoLimiteSeguridad.GLOBAL,
                    CLAVE_PROVEEDOR,
                    new ReglaLimiteSeguridad(
                            properties.getQuotaMaxRequests(),
                            properties.getQuotaWindow(),
                            properties.getQuotaCooldown()
                    )
            );
        } catch (LimiteSeguridadExcedidoException exception) {
            throw traducirExceso(exception.getTipoExceso());
        }
    }

    private LimiteSolicitudSeguridadException traducirExceso(TipoExcesoLimiteSeguridad tipoExceso) {
        return switch (tipoExceso) {
            case COOLDOWN -> new LimiteSolicitudSeguridadException(
                    "Espera unos segundos antes de consultar otro RUC"
            );
            case CUOTA -> new LimiteSolicitudSeguridadException(
                    "Se alcanzo la cuota de consultas RUC disponible. Intenta nuevamente mas tarde"
            );
        };
    }
}
