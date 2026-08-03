package com.regalia.backend.shared.exception;

/** Indica que un proveedor externo rechazo una solicitud valida para el sistema. */
public class ServicioExternoRechazoException extends ReglaNegocioException {

    public ServicioExternoRechazoException(String message) {
        super(message);
    }

    public ServicioExternoRechazoException(String message, Throwable cause) {
        super(message, cause);
    }
}
