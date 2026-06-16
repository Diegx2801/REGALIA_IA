package com.regalia.backend.rubro.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO de entrada para crear o actualizar rubros comerciales de tiendas.
 */
public record RubroRequest(

        @NotBlank(message = "El nombre del rubro es obligatorio")
        @Size(max = 100, message = "El nombre del rubro no puede superar los 100 caracteres")
        String nombre,

        @Size(max = 255, message = "La descripción del rubro no puede superar los 255 caracteres")
        String descripcion
) {
}