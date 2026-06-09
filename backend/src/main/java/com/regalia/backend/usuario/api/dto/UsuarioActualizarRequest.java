package com.regalia.backend.usuario.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO de entrada para actualizar los datos de perfil de un usuario.
 */
public record UsuarioActualizarRequest(

        @NotBlank(message = "Los nombres son obligatorios")
        @Size(max = 100, message = "Los nombres no deben superar los 100 caracteres")
        String nombres,

        @NotBlank(message = "Los apellidos son obligatorios")
        @Size(max = 100, message = "Los apellidos no deben superar los 100 caracteres")
        String apellidos,

        @Size(max = 20, message = "El teléfono no debe superar los 20 caracteres")
        String telefono
) {
}