package com.regalia.backend.usuario.application;

import com.regalia.backend.shared.exception.ReglaNegocioException;

import java.util.Locale;

/**
 * Filtro administrativo para consultar usuarios por estado operativo basico.
 */
public enum UsuarioEstadoFiltro {
    TODOS,
    ACTIVO,
    INACTIVO;

    public static UsuarioEstadoFiltro desde(String valor) {
        if (valor == null || valor.isBlank()) {
            return ACTIVO;
        }

        try {
            return UsuarioEstadoFiltro.valueOf(valor.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ReglaNegocioException("Estado de usuario no valido");
        }
    }

    public Boolean toEstadoBoolean() {
        return switch (this) {
            case ACTIVO -> true;
            case INACTIVO -> false;
            case TODOS -> null;
        };
    }
}
