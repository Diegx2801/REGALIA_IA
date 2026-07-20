package com.regalia.backend.producto.application;

import com.regalia.backend.shared.exception.ReglaNegocioException;
import org.springframework.data.domain.Sort;

import java.util.Arrays;
import java.util.Locale;

/**
 * Ordenamientos permitidos para el catalogo publico.
 */
public enum ProductoPublicoSortField {
    RECOMENDADO("recomendado"),
    PRECIO("precio");

    private static final ProductoPublicoSortField DEFAULT_FIELD = RECOMENDADO;
    private static final Sort.Direction DEFAULT_DIRECTION = Sort.Direction.ASC;

    private final String apiName;

    ProductoPublicoSortField(String apiName) {
        this.apiName = apiName;
    }

    public static ProductoPublicoSortField desde(String sort) {
        String campo = obtenerParte(sort, 0);

        if (campo == null) {
            return DEFAULT_FIELD;
        }

        return Arrays.stream(values())
                .filter(valor -> valor.apiName.equalsIgnoreCase(campo)
                        || valor.name().equalsIgnoreCase(campo))
                .findFirst()
                .orElseThrow(() -> new ReglaNegocioException(
                        "Campo de ordenamiento de producto no valido"
                ));
    }

    public static Sort.Direction direccionDesde(String sort) {
        String direccion = obtenerParte(sort, 1);

        if (direccion == null) {
            return DEFAULT_DIRECTION;
        }

        if ("asc".equals(direccion)) {
            return Sort.Direction.ASC;
        }

        if ("desc".equals(direccion)) {
            return Sort.Direction.DESC;
        }

        throw new ReglaNegocioException("Direccion de ordenamiento de producto no valida");
    }

    private static String obtenerParte(String sort, int indice) {
        if (sort == null || sort.isBlank()) {
            return null;
        }

        String[] partes = sort.trim().split(",");
        if (partes.length <= indice || partes[indice].isBlank()) {
            return null;
        }

        return partes[indice].trim().toLowerCase(Locale.ROOT);
    }
}
