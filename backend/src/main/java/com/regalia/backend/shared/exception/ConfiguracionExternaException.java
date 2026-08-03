package com.regalia.backend.shared.exception;

/** Indica que la configuracion de un proveedor externo no permite operar. */
public class ConfiguracionExternaException extends ServicioExternoNoDisponibleException {

    public ConfiguracionExternaException(String message) {
        super(message);
    }

    public ConfiguracionExternaException(String message, Throwable cause) {
        super(message, cause);
    }
}
