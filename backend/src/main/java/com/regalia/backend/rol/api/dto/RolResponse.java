package com.regalia.backend.rol.api.dto;

import java.time.LocalDateTime;

/**
 * DTO de salida para exponer información de un rol.
 */
public record RolResponse(
        Long idRol,
        String nombre,
        Boolean estado,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion
) {
}