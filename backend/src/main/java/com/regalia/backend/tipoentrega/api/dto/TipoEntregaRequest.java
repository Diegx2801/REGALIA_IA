package com.regalia.backend.tipoentrega.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para registrar o actualizar un tipo de entrega.
 */
public record TipoEntregaRequest(

        @NotBlank(message = "El nombre del tipo de entrega es obligatorio")
        @Size(max = 100, message = "El nombre del tipo de entrega no debe superar los 100 caracteres")
        String nombre
) {
}