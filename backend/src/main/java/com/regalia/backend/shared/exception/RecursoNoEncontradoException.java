package com.regalia.backend.shared.exception;

/**
 * Excepción usada cuando no se encuentra un recurso solicitado.
 */
public class RecursoNoEncontradoException extends RuntimeException {

    public RecursoNoEncontradoException(String message) {
        super(message);
    }
}