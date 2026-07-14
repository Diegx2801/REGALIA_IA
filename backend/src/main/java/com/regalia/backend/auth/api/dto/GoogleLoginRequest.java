package com.regalia.backend.auth.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Solicitud de login con Google Identity Services.
 * El frontend debe enviar el ID token emitido por Google, no el access token.
 */
public record GoogleLoginRequest(
        @NotBlank(message = "El ID token de Google es obligatorio")
        String idToken
) {
}
