package com.regalia.backend.usuariodocumento.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO de entrada para registrar documentos de usuario.
 */
public record UsuarioDocumentoRequest(

        @NotNull(message = "El tipo de documento es obligatorio")
        Long idTipoDocumento,

        @NotBlank(message = "El número de documento es obligatorio")
        @Size(max = 30, message = "El número de documento no debe superar los 30 caracteres")
        String numeroDocumento
) {
}