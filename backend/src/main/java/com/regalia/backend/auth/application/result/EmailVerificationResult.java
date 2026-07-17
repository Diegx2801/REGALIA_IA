package com.regalia.backend.auth.application.result;

/**
 * Resultado de la confirmacion de correo de una cuenta REGALIA.
 */
public record EmailVerificationResult(
        Long idUsuario,
        String correo,
        boolean verificado
) {
}
