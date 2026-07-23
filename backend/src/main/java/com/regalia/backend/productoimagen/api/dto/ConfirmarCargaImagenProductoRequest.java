package com.regalia.backend.productoimagen.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Clave temporal emitida por el backend que se asociará al producto. */
public record ConfirmarCargaImagenProductoRequest(
        @NotBlank(message = "La clave temporal de la imagen es obligatoria")
        @Size(max = 500, message = "La clave temporal no puede superar los 500 caracteres")
        String claveTemporal
) {
}
