package com.regalia.backend.shared.exception;

/**
 * Indica que una dependencia externa necesaria para la operacion no responde correctamente.
 */
public class ServicioExternoNoDisponibleException extends RuntimeException {

    public ServicioExternoNoDisponibleException(String message) {
        super(message);
    }
}
