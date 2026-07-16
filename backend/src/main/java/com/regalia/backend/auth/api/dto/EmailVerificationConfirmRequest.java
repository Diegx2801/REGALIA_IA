package com.regalia.backend.auth.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Recibe el token de verificacion desde el frontend. El token no se transporta
 * como query string para evitar que quede expuesto en historiales y logs HTTP.
 */
public record EmailVerificationConfirmRequest(
        @NotBlank(message = "El token de verificacion es obligatorio")
        @Size(max = 512, message = "El token de verificacion no es valido")
        String token
) {
}
