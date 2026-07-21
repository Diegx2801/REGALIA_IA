package com.regalia.backend.pedido.application;

import com.regalia.backend.shared.exception.ReglaNegocioException;

import java.util.Locale;

/**
 * Estados de pedido permitidos en la consulta administrativa global.
 */
public enum PedidoAdminEstadoFiltro {
    TODOS(null),
    RESERVADO("RESERVADO"),
    EN_PREPARACION("EN_PREPARACION"),
    LISTO("LISTO"),
    ENTREGADO("ENTREGADO"),
    ANULADO("ANULADO");

    private final String estadoPedido;

    PedidoAdminEstadoFiltro(String estadoPedido) {
        this.estadoPedido = estadoPedido;
    }

    public static PedidoAdminEstadoFiltro desde(String valor) {
        if (valor == null || valor.isBlank()) {
            return TODOS;
        }

        try {
            return valueOf(valor.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ReglaNegocioException("Estado de pedido no valido");
        }
    }

    public String estadoPedido() {
        return estadoPedido;
    }
}
