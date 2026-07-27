package com.regalia.backend.tienda.api.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO público para mostrar el detalle de una tienda en el marketplace.
 *
 * Puede traer más información que el listado, pero sigue evitando
 * exponer datos privados o administrativos del vendedor.
 */
public record TiendaPublicaDetalleResponse(
        Long idTienda,
        String nombre,
        String descripcion,
        String direccionReferencia,
        Boolean tiendaFormalizada,
        String urlLogo,
        String urlPortada,
        List<RubroResumen> rubros,
        LocalDateTime fechaCreacion
) {

    public record RubroResumen(
            Long idRubro,
            String nombre
    ) {
    }
}
