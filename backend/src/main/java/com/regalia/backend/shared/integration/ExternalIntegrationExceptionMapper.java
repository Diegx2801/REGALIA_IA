package com.regalia.backend.shared.integration;

import com.regalia.backend.shared.exception.ConfiguracionExternaException;
import com.regalia.backend.shared.exception.ServicioExternoNoDisponibleException;
import com.regalia.backend.shared.exception.ServicioExternoRechazoException;
import org.springframework.web.client.RestClientResponseException;

/** Traduce respuestas HTTP externas a las categorias de error de la API. */
public final class ExternalIntegrationExceptionMapper {

    public RuntimeException map(
            RestClientResponseException exception,
            String configuracionMessage,
            String rechazoMessage,
            String indisponibilidadMessage
    ) {
        int status = exception.getStatusCode().value();

        if (status == 401 || status == 403) {
            return new ConfiguracionExternaException(configuracionMessage, exception);
        }

        if (status == 408 || status == 429 || status >= 500) {
            return new ServicioExternoNoDisponibleException(indisponibilidadMessage, exception);
        }

        return new ServicioExternoRechazoException(rechazoMessage, exception);
    }
}
