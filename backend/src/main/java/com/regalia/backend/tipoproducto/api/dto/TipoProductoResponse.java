package com.regalia.backend.tipoproducto.api.dto;

import java.time.LocalDateTime;

/**
 * DTO de respuesta para tipos de producto.
 */
public record TipoProductoResponse(
        Long idTipoProducto,
        String nombre,
        Boolean estado,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion
) {
}