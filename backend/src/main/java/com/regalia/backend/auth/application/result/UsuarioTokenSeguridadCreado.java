package com.regalia.backend.auth.application.result;

import java.time.LocalDateTime;

/**
 * Resultado interno al emitir un token de seguridad.
 * El token plano solo se devuelve una vez para armar el enlace; en BD queda hasheado.
 */
public record UsuarioTokenSeguridadCreado(
        String token,
        LocalDateTime fechaExpiracion
) {
}
