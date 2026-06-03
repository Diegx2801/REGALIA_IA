package com.regalia.backend.shared.exception;

/**
 * Excepción usada cuando se incumple una regla de negocio del sistema.
 */
public class ReglaNegocioException extends RuntimeException {

    public ReglaNegocioException(String message) {
        super(message);
    }
}