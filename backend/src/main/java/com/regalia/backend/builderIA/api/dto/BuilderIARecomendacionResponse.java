package com.regalia.backend.builderIA.api.dto;

import java.util.List;

/**
 * Respuesta final de recomendaciones preparada para el frontend del builder.
 */
public record BuilderIARecomendacionResponse(
        String respuesta,
        List<BuilderIAProductoRecomendadoResponse> productosRecomendados
) {
}
