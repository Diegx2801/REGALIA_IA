package com.regalia.backend.shared.exception;

/**
 * Indica que una accion publica supero su frecuencia permitida.
 */
public class LimiteSolicitudSeguridadException extends RuntimeException {

    public LimiteSolicitudSeguridadException(String message) {
        super(message);
    }
}
