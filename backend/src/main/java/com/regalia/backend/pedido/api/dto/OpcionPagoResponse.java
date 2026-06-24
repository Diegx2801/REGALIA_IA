package com.regalia.backend.pedido.api.dto;

/**
 * DTO para representar una opción de pago seleccionable por el cliente.
 *
 * No expone ID porque el frontend debe trabajar con códigos estables
 * y no con identificadores internos de base de datos.
 */
public record OpcionPagoResponse(
        String codigo,
        String nombre,
        String descripcion
) {
}