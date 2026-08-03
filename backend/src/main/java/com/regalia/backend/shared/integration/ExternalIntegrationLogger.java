package com.regalia.backend.shared.integration;

import org.slf4j.Logger;
import org.springframework.web.client.RestClientResponseException;

/** Registra solo metadatos operativos de integraciones externas, nunca payloads ni credenciales. */
public final class ExternalIntegrationLogger {

    private ExternalIntegrationLogger() {
    }

    public static void logSuccess(Logger logger, String provider, String operation, long startedAtNanos) {
        logger.debug(
                "External integration provider={} operation={} status=SUCCESS httpStatus={} durationMs={}",
                provider,
                operation,
                "none",
                elapsedMilliseconds(startedAtNanos)
        );
    }

    public static void logFailure(
            Logger logger,
            String provider,
            String operation,
            Throwable exception,
            long startedAtNanos
    ) {
        logger.warn(
                "External integration provider={} operation={} status=FAILURE httpStatus={} durationMs={} exceptionType={}",
                provider,
                operation,
                httpStatus(exception),
                elapsedMilliseconds(startedAtNanos),
                exception.getClass().getSimpleName()
        );
    }

    private static String httpStatus(Throwable exception) {
        if (exception instanceof RestClientResponseException responseException) {
            return String.valueOf(responseException.getStatusCode().value());
        }

        return "none";
    }

    private static long elapsedMilliseconds(long startedAtNanos) {
        return (System.nanoTime() - startedAtNanos) / 1_000_000;
    }
}
