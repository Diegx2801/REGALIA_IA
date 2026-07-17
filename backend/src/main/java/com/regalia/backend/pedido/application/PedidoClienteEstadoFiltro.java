package com.regalia.backend.pedido.application;

import com.regalia.backend.shared.exception.ReglaNegocioException;

import java.util.Locale;

/**
 * Estados de pedido que un cliente puede usar para filtrar su propio historial.
 */
public enum PedidoClienteEstadoFiltro {
    TODOS(null),
    RESERVADO("RESERVADO"),
    EN_PREPARACION("EN_PREPARACION"),
    LISTO("LISTO"),
    ENTREGADO("ENTREGADO"),
    ANULADO("ANULADO");

    private final String estadoPedido;

    PedidoClienteEstadoFiltro(String estadoPedido) {
        this.estadoPedido = estadoPedido;
    }

    public static PedidoClienteEstadoFiltro desde(String valor) {
        if (valor == null || valor.isBlank()) {
            return TODOS;
        }

        try {
            return PedidoClienteEstadoFiltro.valueOf(valor.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ReglaNegocioException("Estado de pedido no valido");
        }
    }

    public String estadoPedido() {
        return estadoPedido;
    }
}
