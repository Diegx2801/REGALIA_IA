package com.regalia.backend.usuario.application;

import com.regalia.backend.shared.exception.ReglaNegocioException;

import java.util.Locale;

/**
 * Campos permitidos para busqueda administrativa de usuarios.
 */
public enum UsuarioSearchField {
    NOMBRE,
    CORREO,
    TELEFONO,
    ID_USUARIO;

    public static UsuarioSearchField desde(String valor) {
        if (valor == null || valor.isBlank()) {
            return NOMBRE;
        }

        try {
            return UsuarioSearchField.valueOf(valor.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ReglaNegocioException("Campo de busqueda de usuario no valido");
        }
    }
}
