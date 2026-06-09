package com.regalia.backend.auth.api.dto;

import java.util.List;

/**
 * DTO de salida para devolver el token JWT y datos mínimos del usuario autenticado.
 */
public record LoginResponse(
        String token,
        String tipo,
        Long idUsuario,
        String correo,
        List<String> roles,
        Long expiraEnMinutos
) {
}