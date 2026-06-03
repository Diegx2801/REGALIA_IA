package com.regalia.backend.shared.exception;

/**
 * Excepción usada cuando se intenta crear o actualizar un recurso con datos únicos ya existentes.
 */
public class RecursoDuplicadoException extends RuntimeException {

    public RecursoDuplicadoException(String message) {
        super(message);
    }
}