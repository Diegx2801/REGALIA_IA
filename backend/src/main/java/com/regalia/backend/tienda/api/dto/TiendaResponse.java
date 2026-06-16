package com.regalia.backend.tienda.api.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO de salida para exponer información de una tienda.
 */
public record TiendaResponse(
        Long idTienda,
        Long idVendedor,
        Long idUsuario,
        String nombreVendedor,
        String apellidoVendedor,
        String correoVendedor,
        String nombre,
        String descripcion,
        String direccionReferencia,
        String estadoRevision,
        Boolean tiendaFormalizada,
        Long idDocumentoFiscal,
        String numeroDocumentoFiscal,
        List<RubroResumen> rubros,
        Boolean estado,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion
) {

    /**
     * DTO resumido para mostrar rubros asociados a una tienda.
     */
    public record RubroResumen(
            Long idRubro,
            String nombre
    ) {
    }
}