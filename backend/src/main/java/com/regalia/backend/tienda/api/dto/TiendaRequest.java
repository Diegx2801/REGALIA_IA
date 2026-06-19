package com.regalia.backend.tienda.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * DTO de entrada para crear o actualizar una tienda.
 */
public record TiendaRequest(

        @NotBlank(message = "El nombre de la tienda es obligatorio")
        @Size(max = 150, message = "El nombre de la tienda no puede superar los 150 caracteres")
        String nombre,

        @Size(max = 1000, message = "La descripción no puede superar los 1000 caracteres")
        String descripcion,

        @Size(max = 255, message = "La dirección de referencia no puede superar los 255 caracteres")
        String direccionReferencia,

        Long idDocumentoFiscal,

        List<Long> idsRubros
) {
}