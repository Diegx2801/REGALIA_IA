package com.regalia.backend.pedido.application;

import com.regalia.backend.shared.exception.ReglaNegocioException;

import java.util.Locale;

/**
 * Campos permitidos para busqueda administrativa de pedidos.
 */
public enum PedidoSearchField {
    ID_PEDIDO,
    NOMBRE_TIENDA,
    ID_USUARIO,
    ID_TIENDA,
    ESTADO_PEDIDO;

    public static PedidoSearchField desde(String valor) {
        if (valor == null || valor.isBlank()) {
            return ID_PEDIDO;
        }

        try {
            return PedidoSearchField.valueOf(valor.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ReglaNegocioException("Campo de busqueda de pedido no valido");
        }
    }
}
