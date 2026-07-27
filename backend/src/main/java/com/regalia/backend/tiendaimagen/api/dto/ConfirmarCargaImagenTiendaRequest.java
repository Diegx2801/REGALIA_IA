package com.regalia.backend.tiendaimagen.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Referencia a una carga temporal que el backend debe validar y publicar. */
public record ConfirmarCargaImagenTiendaRequest(
        @NotBlank(message = "La clave temporal es obligatoria")
        @Size(max = 500, message = "La clave temporal no puede superar los 500 caracteres")
        String claveTemporal
) {
}
