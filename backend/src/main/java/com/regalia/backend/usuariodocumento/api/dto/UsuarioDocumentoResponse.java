package com.regalia.backend.usuariodocumento.api.dto;

import java.time.LocalDateTime;

/**
 * DTO de salida para exponer documentos registrados por un usuario.
 */
public record UsuarioDocumentoResponse(
        Long idUsuarioDocumento,
        Long idTipoDocumento,
        String tipoDocumento,
        String abreviatura,
        String numeroDocumento,
        String estadoVerificacion,
        Boolean estado,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion
) {
}