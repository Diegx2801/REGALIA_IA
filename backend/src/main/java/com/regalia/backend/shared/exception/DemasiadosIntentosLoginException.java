package com.regalia.backend.shared.exception;

import com.regalia.backend.auth.application.LoginAttemptStatus;

/**
 * Excepcion lanzada cuando se supera el limite temporal de intentos de login.
 */
public class DemasiadosIntentosLoginException extends RuntimeException {

    private static final String MENSAJE = "Demasiados intentos de inicio de sesion. Intenta nuevamente en unos minutos";

    private final LoginAttemptStatus estadoIntentos;

    public DemasiadosIntentosLoginException() {
        this(null);
    }

    public DemasiadosIntentosLoginException(LoginAttemptStatus estadoIntentos) {
        super(MENSAJE);
        this.estadoIntentos = estadoIntentos;
    }

    public LoginAttemptStatus getEstadoIntentos() {
        return estadoIntentos;
    }
}
