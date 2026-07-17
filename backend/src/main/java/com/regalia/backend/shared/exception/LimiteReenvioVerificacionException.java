package com.regalia.backend.shared.exception;

/**
 * Expone al cliente el rechazo especifico del caso de uso de reenvio de
 * correo, sin acoplar la API a la infraestructura generica de limites.
 */
public class LimiteReenvioVerificacionException extends RuntimeException {

    public LimiteReenvioVerificacionException(String message) {
        super(message);
    }
}
