package com.regalia.backend.auth.application.result;

import java.util.List;

/**
 * Resultado interno de autenticacion usado por la capa de aplicacion.
 */
public record LoginResult(
        String token,
        String tipo,
        Long idUsuario,
        String correo,
        List<String> roles,
        String authContext,
        Long expiraEnMinutos
) {
}
