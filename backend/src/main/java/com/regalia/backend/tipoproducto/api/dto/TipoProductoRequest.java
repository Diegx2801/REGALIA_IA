package com.regalia.backend.tipoproducto.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para registrar o actualizar un tipo de producto.
 */
public record TipoProductoRequest(

        @NotBlank(message = "El nombre del tipo de producto es obligatorio")
        @Size(max = 100, message = "El nombre del tipo de producto no debe superar los 100 caracteres")
        String nombre
) {
}