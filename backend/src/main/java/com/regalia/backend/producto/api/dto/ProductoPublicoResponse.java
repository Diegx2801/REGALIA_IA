package com.regalia.backend.producto.api.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO público para mostrar productos visibles en el marketplace.
 *
 * No expone datos administrativos ni internos del vendedor.
 */
public record ProductoPublicoResponse(
        Long idProducto,
        Long idTienda,
        String nombreTienda,
        Long idTipoProducto,
        String tipoProducto,
        String nombre,
        String descripcion,
        BigDecimal precio,
        Integer stock,
        List<ImagenResumen> imagenes
) {

    public record ImagenResumen(
            String urlImagen,
            Integer orden
    ) {
    }
}