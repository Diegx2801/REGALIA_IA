package com.regalia.backend.tiendaimagen.api.dto;

/** Referencia pública de una imagen de identidad ya validada. */
public record TiendaImagenResponse(
        String tipoImagen,
        String urlImagen,
        Integer ancho,
        Integer alto
) {
}
