package com.regalia.backend.tipodocumento.api.dto;

import java.time.LocalDateTime;

/**
 * DTO de salida para exponer información de un tipo de documento.
 */
public record TipoDocumentoResponse(
        Long idTipoDocumento,
        Long idCategoriaDocumento,
        String categoriaDocumento,
        String nombre,
        String abreviatura,
        Integer longitudMinima,
        Integer longitudMaxima,
        Boolean estado,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion
) {
}