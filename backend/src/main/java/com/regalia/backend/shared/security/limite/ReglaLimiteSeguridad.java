package com.regalia.backend.shared.security.limite;

import java.time.Duration;

/**
 * Parametros de una politica de frecuencia. Las politicas viven en codigo y
 * la tabla almacena solamente el estado mutable de cada sujeto.
 */
public record ReglaLimiteSeguridad(
        int maximoSolicitudes,
        Duration duracionVentana,
        Duration cooldown
) {
    public ReglaLimiteSeguridad {
        if (maximoSolicitudes < 1 || duracionVentana.isNegative() || duracionVentana.isZero()
                || cooldown.isNegative()) {
            throw new IllegalArgumentException("La regla de limite de seguridad no es valida");
        }
    }
}
