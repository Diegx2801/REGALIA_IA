package com.regalia.backend.tipopago.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO de entrada para actualizar datos visibles de un tipo de pago.
 */
public record TipoPagoRequest(

        @NotBlank(message = "El nombre del tipo de pago es obligatorio")
        @Size(max = 100, message = "El nombre no debe superar los 100 caracteres")
        String nombre,

        @Size(max = 500, message = "La descripción no debe superar los 500 caracteres")
        String descripcion
) {
}
