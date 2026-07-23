package com.regalia.backend.productoimagen.api.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

/** Orden completo de las imágenes activas de un producto. */
public record OrdenImagenesProductoRequest(
        @NotEmpty(message = "Debes indicar el orden de las imágenes")
        List<@NotNull @Positive Long> idsProductoImagen
) {
}
