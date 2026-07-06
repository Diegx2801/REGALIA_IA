package com.regalia.backend.builderIA.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Solicitud para pedir recomendaciones inteligentes de productos REGALIA.
 */
public record BuilderIARecomendacionRequest(

        @NotBlank(message = "La busqueda es obligatoria")
        @Size(max = 800, message = "La busqueda no debe superar los 800 caracteres")
        String busqueda
) {
}
