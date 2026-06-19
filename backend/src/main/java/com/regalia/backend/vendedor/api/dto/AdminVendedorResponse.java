package com.regalia.backend.vendedor.api.dto;

import java.time.LocalDateTime;

/**
 * DTO de salida para que ADMIN consulte información de vendedores.
 */
public record AdminVendedorResponse(
        Long idVendedor,
        Long idUsuario,
        String nombreUsuario,
        String apellidoUsuario,
        String correoUsuario,
        Boolean vendedorVerificado,
        Long cantidadTiendasActivas,
        Long cantidadTiendasTotales,
        Boolean estado,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion
) {
}