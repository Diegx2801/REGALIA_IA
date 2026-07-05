package com.regalia.backend.shared.response;

import java.util.List;
import java.util.Objects;

/**
 * Contrato generico para respuestas paginadas expuestas por la API.
 */
public record PaginaResponse<T>(
        List<T> contenido,
        int paginaActual,
        int tamanioPagina,
        long totalElementos,
        int totalPaginas,
        boolean ultimaPagina
) {

    public PaginaResponse {
        contenido = List.copyOf(Objects.requireNonNull(contenido, "contenido no puede ser null"));

        if (paginaActual < 0) {
            throw new IllegalArgumentException("paginaActual no puede ser negativa");
        }

        if (tamanioPagina < 1) {
            throw new IllegalArgumentException("tamanioPagina debe ser mayor a cero");
        }

        if (totalElementos < 0) {
            throw new IllegalArgumentException("totalElementos no puede ser negativo");
        }

        if (totalPaginas < 0) {
            throw new IllegalArgumentException("totalPaginas no puede ser negativo");
        }
    }
}
