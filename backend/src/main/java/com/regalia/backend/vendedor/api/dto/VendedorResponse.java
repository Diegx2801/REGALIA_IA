package com.regalia.backend.vendedor.api.dto;

import java.time.LocalDateTime;

/**
 * DTO de salida para exponer el perfil vendedor de un usuario.
 */
public record VendedorResponse(
        Long idVendedor,
        Long idUsuario,
        String nombreUsuario,
        String apellidoUsuario,
        String correoUsuario,
        Boolean vendedorVerificado,
        Boolean estado,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion
) {
}