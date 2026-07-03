package com.regalia.backend.tienda.application;

import com.regalia.backend.shared.exception.ReglaNegocioException;

import java.util.Locale;

/**
 * Campos permitidos para busqueda administrativa de tiendas.
 */
public enum TiendaSearchField {
    NOMBRE,
    VENDEDOR,
    CORREO_VENDEDOR,
    ID_TIENDA;

    public static TiendaSearchField desde(String valor) {
        if (valor == null || valor.isBlank()) {
            return NOMBRE;
        }

        try {
            return TiendaSearchField.valueOf(valor.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ReglaNegocioException("Campo de busqueda de tienda no valido");
        }
    }
}
