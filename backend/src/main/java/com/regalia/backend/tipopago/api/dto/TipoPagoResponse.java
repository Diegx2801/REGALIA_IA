package com.regalia.backend.tipopago.api.dto;

import java.time.LocalDateTime;

/**
 * DTO de salida para exponer información de un tipo de pago.
 */
public record TipoPagoResponse(
        Long idTipoPago,
        String nombre,
        String descripcion,
        Boolean estado,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion
) {
}