package com.regalia.backend.builderIA.api.dto;

import java.math.BigDecimal;

/**
 * Producto real del marketplace recomendado por el asistente IA.
 */
public record BuilderIAProductoRecomendadoResponse(
        Long idProducto,
        String nombre,
        String descripcion,
        BigDecimal precio,
        Integer stock,
        Long idTienda,
        String nombreTienda,
        String tipoProducto
) {
}
