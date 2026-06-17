package com.regalia.backend.producto.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO de salida para exponer información de productos.
 */
public record ProductoResponse(
        Long idProducto,
        Long idTienda,
        String nombreTienda,
        Long idTipoProducto,
        String tipoProducto,
        String nombre,
        String descripcion,
        BigDecimal precio,
        Integer stock,
        Boolean visibleEnTienda,
        List<ImagenResumen> imagenes,
        Boolean estado,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion
) {

    /**
     * DTO resumido para mostrar imágenes asociadas a un producto.
     */
    public record ImagenResumen(
            Long idProductoImagen,
            String urlImagen,
            Integer orden
    ) {
    }
}