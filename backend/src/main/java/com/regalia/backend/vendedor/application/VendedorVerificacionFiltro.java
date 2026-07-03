package com.regalia.backend.vendedor.application;

import com.regalia.backend.shared.exception.ReglaNegocioException;

import java.util.Locale;

/**
 * Filtro administrativo para consultar vendedores por verificacion.
 */
public enum VendedorVerificacionFiltro {
    TODOS,
    VERIFICADO,
    SIN_VERIFICAR;

    public static VendedorVerificacionFiltro desde(String valor) {
        if (valor == null || valor.isBlank()) {
            return TODOS;
        }

        try {
            return VendedorVerificacionFiltro.valueOf(valor.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ReglaNegocioException("Filtro de verificacion de vendedor no valido");
        }
    }
}
