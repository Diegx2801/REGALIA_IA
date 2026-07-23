package com.regalia.backend.producto.api.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/**
 * DTO de entrada para crear o actualizar productos.
 */
public record ProductoRequest(

        @NotNull(message = "El tipo de producto es obligatorio")
        Long idTipoProducto,

        @NotBlank(message = "El nombre del producto es obligatorio")
        @Size(max = 150, message = "El nombre del producto no puede superar los 150 caracteres")
        String nombre,

        @Size(max = 1000, message = "La descripción no puede superar los 1000 caracteres")
        String descripcion,

        @NotNull(message = "El precio del producto es obligatorio")
        @DecimalMin(value = "0.01", message = "El precio debe ser mayor a 0")
        BigDecimal precio,

        @NotNull(message = "El stock del producto es obligatorio")
        @Min(value = 0, message = "El stock no puede ser negativo")
        Integer stock,

        Boolean visibleEnTienda
) {
}
