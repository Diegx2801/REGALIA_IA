package com.regalia.backend.tienda.application;

import com.regalia.backend.shared.exception.ReglaNegocioException;
import org.springframework.data.domain.Sort;

import java.util.Arrays;
import java.util.Locale;

/**
 * Campos permitidos para ordenar consultas administrativas de tiendas.
 */
public enum TiendaAdminSortField {
    ID_TIENDA("idTienda"),
    NOMBRE("nombre"),
    ESTADO_REVISION("estadoRevision"),
    NOMBRE_VENDEDOR("nombreVendedor"),
    FECHA_CREACION("fechaCreacion");

    private static final TiendaAdminSortField DEFAULT_FIELD = ID_TIENDA;
    private static final Sort.Direction DEFAULT_DIRECTION = Sort.Direction.ASC;

    private final String apiName;

    TiendaAdminSortField(String apiName) {
        this.apiName = apiName;
    }

    public static TiendaAdminSortField desde(String sort) {
        String campo = obtenerCampo(sort);

        if (campo == null) {
            return DEFAULT_FIELD;
        }

        return Arrays.stream(values())
                .filter(value -> value.apiName.equalsIgnoreCase(campo)
                        || value.name().equalsIgnoreCase(campo))
                .findFirst()
                .orElseThrow(() -> new ReglaNegocioException("Campo de ordenamiento de tienda no valido"));
    }

    public static Sort.Direction direccionDesde(String sort) {
        String direccion = obtenerDireccion(sort);

        if (direccion == null) {
            return DEFAULT_DIRECTION;
        }

        if ("asc".equalsIgnoreCase(direccion)) {
            return Sort.Direction.ASC;
        }

        if ("desc".equalsIgnoreCase(direccion)) {
            return Sort.Direction.DESC;
        }

        throw new ReglaNegocioException("Direccion de ordenamiento de tienda no valida");
    }

    public String apiName() {
        return apiName;
    }

    private static String obtenerCampo(String sort) {
        if (sort == null || sort.isBlank()) {
            return null;
        }

        String[] partes = sort.trim().split(",");
        return normalizar(partes[0]);
    }

    private static String obtenerDireccion(String sort) {
        if (sort == null || sort.isBlank()) {
            return null;
        }

        String[] partes = sort.trim().split(",");
        if (partes.length < 2) {
            return null;
        }

        return normalizar(partes[1]);
    }

    private static String normalizar(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }

        return valor.trim().toLowerCase(Locale.ROOT);
    }
}
