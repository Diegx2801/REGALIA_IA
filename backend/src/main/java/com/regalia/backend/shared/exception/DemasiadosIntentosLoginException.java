package com.regalia.backend.shared.exception;

/**
 * Excepcion lanzada cuando se supera el limite temporal de intentos de login.
 */
public class DemasiadosIntentosLoginException extends RuntimeException {

    private static final String MENSAJE = "Demasiados intentos de inicio de sesion. Intenta nuevamente en unos minutos";

    public DemasiadosIntentosLoginException() {
        super(MENSAJE);
    }
}
