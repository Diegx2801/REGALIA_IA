package com.regalia.backend.usuariodocumento.api.dto;

import java.time.LocalDateTime;

/**
 * DTO de salida para que ADMIN revise solicitudes de verificación de documentos.
 */
public record AdminUsuarioDocumentoResponse(
        Long idUsuarioDocumento,
        Long idUsuario,
        String nombreUsuario,
        String apellidoUsuario,
        String correoUsuario,
        Long idTipoDocumento,
        String tipoDocumento,
        String abreviatura,
        Long idCategoriaDocumento,
        String categoriaDocumento,
        String numeroDocumento,
        String estadoVerificacion,
        Boolean estado,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion
) {
}