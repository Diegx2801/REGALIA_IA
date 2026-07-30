package com.regalia.backend.tiendaimagen.infrastructure.entity;

import com.regalia.backend.shared.exception.ReglaNegocioException;

import java.util.Locale;

/** Tipos de identidad visual admitidos para una tienda. */
public enum TipoImagenTienda {
    LOGO,
    PORTADA;

    public static TipoImagenTienda desde(String valor) {
        try {
            return valueOf(valor.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException exception) {
            throw new ReglaNegocioException("El tipo de imagen de tienda no es valido");
        }
    }
}
