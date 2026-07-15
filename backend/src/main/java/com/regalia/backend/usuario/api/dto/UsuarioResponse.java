package com.regalia.backend.usuario.api.dto;

import java.time.LocalDateTime;

/**
 * DTO de salida para exponer información de un usuario.
 */
public record UsuarioResponse(
        Long idUsuario,
        String nombres,
        String apellidos,
        String correo,
        String telefono,
        Boolean correoVerificado,
        Boolean estado,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion
) {
}
