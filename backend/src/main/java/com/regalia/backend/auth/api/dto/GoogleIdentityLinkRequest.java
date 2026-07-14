package com.regalia.backend.auth.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Solicitud para vincular una cuenta REGALIA autenticada con Google.
 */
public record GoogleIdentityLinkRequest(
        @NotBlank(message = "El ID token de Google es obligatorio")
        String idToken
) {
}
