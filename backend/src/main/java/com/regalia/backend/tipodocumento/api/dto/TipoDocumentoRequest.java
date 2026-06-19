package com.regalia.backend.tipodocumento.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO de entrada para crear o actualizar tipos de documento.
 */
public record TipoDocumentoRequest(

        @NotBlank(message = "El nombre del tipo de documento es obligatorio")
        @Size(max = 80, message = "El nombre no debe superar los 80 caracteres")
        String nombre,

        @NotBlank(message = "La abreviatura del tipo de documento es obligatoria")
        @Size(max = 10, message = "La abreviatura no debe superar los 10 caracteres")
        String abreviatura,

        @NotNull(message = "La longitud mínima es obligatoria")
        @Min(value = 1, message = "La longitud mínima debe ser mayor a 0")
        Integer longitudMinima,

        @NotNull(message = "La longitud máxima es obligatoria")
        @Min(value = 1, message = "La longitud máxima debe ser mayor a 0")
        Integer longitudMaxima,

        @NotNull(message = "La categoría del documento es obligatoria")
        Long idCategoriaDocumento
) {
}