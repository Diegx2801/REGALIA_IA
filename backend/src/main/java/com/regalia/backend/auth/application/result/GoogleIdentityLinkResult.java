package com.regalia.backend.auth.application.result;

/**
 * Resultado interno de una vinculacion SSO con Google.
 */
public record GoogleIdentityLinkResult(
        String proveedor,
        String correo,
        boolean vinculada
) {
}
