package com.regalia.backend.vendedor.application;

import com.regalia.backend.shared.exception.ReglaNegocioException;

import java.util.Locale;

/**
 * Campos permitidos para busqueda administrativa de vendedores.
 */
public enum VendedorSearchField {
    NOMBRE,
    CORREO,
    ID_VENDEDOR,
    ID_USUARIO;

    public static VendedorSearchField desde(String valor) {
        if (valor == null || valor.isBlank()) {
            return NOMBRE;
        }

        try {
            return VendedorSearchField.valueOf(valor.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ReglaNegocioException("Campo de busqueda de vendedor no valido");
        }
    }
}
