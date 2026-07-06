package com.regalia.backend.builderIA.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Solicitud para conversar con el asistente IA dentro del contexto REGALIA.
 */
public record BuilderIAChatRequest(

        @NotBlank(message = "La pregunta es obligatoria")
        @Size(max = 1000, message = "La pregunta no debe superar los 1000 caracteres")
        String pregunta
) {
}
