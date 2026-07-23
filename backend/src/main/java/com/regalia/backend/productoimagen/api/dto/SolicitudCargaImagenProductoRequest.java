package com.regalia.backend.productoimagen.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** Metadatos declarados antes de solicitar una URL de carga temporal. */
public record SolicitudCargaImagenProductoRequest(
        @NotBlank(message = "El nombre del archivo es obligatorio")
        @Size(max = 255, message = "El nombre del archivo no puede superar los 255 caracteres")
        String nombreArchivo,

        @NotBlank(message = "El tipo de contenido es obligatorio")
        @Size(max = 100, message = "El tipo de contenido no puede superar los 100 caracteres")
        String tipoContenido,

        @NotNull(message = "El tamaño del archivo es obligatorio")
        @Positive(message = "El tamaño del archivo debe ser mayor a cero")
        Long tamanioBytes
) {
}
