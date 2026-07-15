package com.regalia.backend.auth.api.dto;

import java.time.LocalDateTime;

public record AccountIdentityResponse(
        String proveedor,
        String correo,
        boolean correoVerificado,
        boolean vinculada,
        LocalDateTime fechaVinculacion
) {
}
