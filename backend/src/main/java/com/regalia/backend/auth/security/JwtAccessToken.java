package com.regalia.backend.auth.security;

import java.util.List;

/**
 * Claims ya validados de un JWT de acceso. Evita parsear el mismo token varias
 * veces dentro del filtro de autenticacion.
 */
public record JwtAccessToken(
        Long idUsuario,
        String correo,
        List<String> roles,
        AuthContext authContext,
        Integer versionAutenticacion
) {
}
