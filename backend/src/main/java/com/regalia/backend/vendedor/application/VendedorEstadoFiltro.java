package com.regalia.backend.vendedor.application;

import com.regalia.backend.shared.exception.ReglaNegocioException;

import java.util.Locale;

/**
 * Filtro administrativo para consultar vendedores por estado operativo.
 */
public enum VendedorEstadoFiltro {
    TODOS,
    ACTIVO,
    INACTIVO;

    public static VendedorEstadoFiltro desde(String valor) {
        if (valor == null || valor.isBlank()) {
            return TODOS;
        }

        try {
            return VendedorEstadoFiltro.valueOf(valor.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ReglaNegocioException("Estado de vendedor no valido");
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
