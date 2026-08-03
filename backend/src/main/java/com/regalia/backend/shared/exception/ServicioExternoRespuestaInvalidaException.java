package com.regalia.backend.shared.exception;

/** Indica que un proveedor externo respondio sin los datos necesarios. */
public class ServicioExternoRespuestaInvalidaException extends ServicioExternoNoDisponibleException {

    public ServicioExternoRespuestaInvalidaException(String message) {
        super(message);
    }

    public ServicioExternoRespuestaInvalidaException(String message, Throwable cause) {
        super(message, cause);
    }
}
