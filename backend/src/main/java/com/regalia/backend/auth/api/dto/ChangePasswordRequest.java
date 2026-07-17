package com.regalia.backend.auth.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Cambio autenticado de una contrasena local.
 */
public record ChangePasswordRequest(
        @NotBlank(message = "La contrasena actual es obligatoria")
        @Size(max = 100, message = "La contrasena actual no es valida")
        String contrasenaActual,
        @NotBlank(message = "La nueva contrasena es obligatoria")
        @Size(min = 8, max = 100, message = "La nueva contrasena debe tener entre 8 y 100 caracteres")
        String nuevaContrasena
) {
}
