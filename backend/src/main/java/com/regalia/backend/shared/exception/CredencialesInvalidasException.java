package com.regalia.backend.shared.exception;

/**
 * Excepción lanzada cuando las credenciales de autenticación son inválidas.
 */
public class CredencialesInvalidasException extends RuntimeException {

    public CredencialesInvalidasException(String message) {
        super(message);
    }
}