package com.regalia.backend.producto.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO de entrada para registrar imágenes de un producto.
 */
public record ProductoImagenRequest(

        @NotBlank(message = "La URL de la imagen es obligatoria")
        @Size(max = 500, message = "La URL de la imagen no puede superar los 500 caracteres")
        String urlImagen,

        @NotNull(message = "El orden de la imagen es obligatorio")
        @Min(value = 1, message = "El orden de la imagen debe ser mayor o igual a 1")
        Integer orden
) {
}