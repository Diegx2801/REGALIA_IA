package com.regalia.backend.shared.exception;

import com.regalia.backend.auth.application.LoginAttemptStatus;

/**
 * Excepción lanzada cuando las credenciales de autenticación son inválidas.
 */
public class CredencialesInvalidasException extends RuntimeException {

    private final LoginAttemptStatus estadoIntentos;

    public CredencialesInvalidasException(String message) {
        this(message, null);
    }

    public CredencialesInvalidasException(String message, LoginAttemptStatus estadoIntentos) {
        super(message);
        this.estadoIntentos = estadoIntentos;
    }

    public LoginAttemptStatus getEstadoIntentos() {
        return estadoIntentos;
    }
}
