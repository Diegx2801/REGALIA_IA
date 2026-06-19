package com.regalia.backend.tipoentrega.api.dto;

import java.time.LocalDateTime;

/**
 * DTO de respuesta para tipos de entrega.
 */
public record TipoEntregaResponse(
        Long idTipoEntrega,
        String nombre,
        Boolean estado,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion
) {
}