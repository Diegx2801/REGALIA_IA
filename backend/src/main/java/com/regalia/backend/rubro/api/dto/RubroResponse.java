package com.regalia.backend.rubro.api.dto;

import java.time.LocalDateTime;

/**
 * DTO de salida para exponer rubros comerciales de tiendas.
 */
public record RubroResponse(
        Long idRubro,
        String nombre,
        String descripcion,
        Boolean estado,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion
) {
}