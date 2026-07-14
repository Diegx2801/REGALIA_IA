package com.regalia.backend.auth.application.oauth;

/**
 * Identidad normalizada obtenida desde Google despues de validar el ID token.
 */
public record GoogleUserIdentity(
        String subject,
        String email,
        boolean emailVerified,
        String givenName,
        String familyName,
        String fullName,
        String pictureUrl
) {
}
