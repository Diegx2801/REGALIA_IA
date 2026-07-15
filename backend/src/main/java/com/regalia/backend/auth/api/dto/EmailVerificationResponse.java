package com.regalia.backend.auth.api.dto;

/**
 * Respuesta publica al confirmar el correo de una cuenta local.
 */
public record EmailVerificationResponse(
        Long idUsuario,
        String correo,
        boolean verificado
) {
}
