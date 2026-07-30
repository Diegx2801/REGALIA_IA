package com.regalia.backend.tienda.api.dto;

import java.util.List;

/**
 * DTO público y liviano para mostrar tiendas en el marketplace.
 *
 * No expone datos internos del vendedor como correo, idUsuario,
 * documento fiscal o información administrativa privada.
 */
public record TiendaPublicaResponse(
        Long idTienda,
        String nombre,
        String descripcion,
        String direccionReferencia,
        Boolean tiendaFormalizada,
        String urlLogo,
        String urlPortada,
        List<RubroResumen> rubros
) {

    public record RubroResumen(
            Long idRubro,
            String nombre
    ) {
    }
}
