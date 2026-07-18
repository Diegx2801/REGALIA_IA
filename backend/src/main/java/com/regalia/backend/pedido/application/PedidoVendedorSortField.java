package com.regalia.backend.pedido.application;

import com.regalia.backend.shared.exception.ReglaNegocioException;
import org.springframework.data.domain.Sort;

import java.util.Arrays;
import java.util.Locale;

/** Campos permitidos para ordenar la bandeja privada de pedidos del vendedor. */
public enum PedidoVendedorSortField {
    FECHA_CREACION("fechaCreacion"),
    FECHA_ENTREGA("fechaEntrega"),
    NOMBRE_TIENDA("nombreTienda"),
    TOTAL("total"),
    SALDO_PENDIENTE("saldoPendiente");

    private static final PedidoVendedorSortField DEFAULT_FIELD = FECHA_CREACION;
    private static final Sort.Direction DEFAULT_DIRECTION = Sort.Direction.DESC;

    private final String apiName;

    PedidoVendedorSortField(String apiName) {
        this.apiName = apiName;
    }

    public static PedidoVendedorSortField desde(String sort) {
        String campo = obtenerParte(sort, 0);
        if (campo == null) return DEFAULT_FIELD;

        return Arrays.stream(values())
                .filter(value -> value.apiName.equalsIgnoreCase(campo)
                        || value.name().equalsIgnoreCase(campo))
                .findFirst()
                .orElseThrow(() -> new ReglaNegocioException("Campo de ordenamiento de pedido no valido"));
    }

    public static Sort.Direction direccionDesde(String sort) {
        String direccion = obtenerParte(sort, 1);
        if (direccion == null) return DEFAULT_DIRECTION;
        if ("asc".equalsIgnoreCase(direccion)) return Sort.Direction.ASC;
        if ("desc".equalsIgnoreCase(direccion)) return Sort.Direction.DESC;
        throw new ReglaNegocioException("Direccion de ordenamiento de pedido no valida");
    }

    public String apiName() {
        return apiName;
    }

    private static String obtenerParte(String sort, int indice) {
        if (sort == null || sort.isBlank()) return null;
        String[] partes = sort.trim().split(",");
        if (partes.length <= indice || partes[indice].isBlank()) return null;
        return partes[indice].trim().toLowerCase(Locale.ROOT);
    }
}
