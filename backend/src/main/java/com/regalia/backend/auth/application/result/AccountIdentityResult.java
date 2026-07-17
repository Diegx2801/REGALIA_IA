package com.regalia.backend.auth.application.result;

import java.time.LocalDateTime;

/**
 * Identidad externa vinculada a una cuenta autenticada.
 */
public record AccountIdentityResult(
        String proveedor,
        String correo,
        boolean correoVerificado,
        boolean vinculada,
        LocalDateTime fechaVinculacion
) {
}
