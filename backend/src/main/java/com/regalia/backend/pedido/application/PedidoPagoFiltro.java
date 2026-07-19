package com.regalia.backend.pedido.application;

import com.regalia.backend.shared.exception.ReglaNegocioException;

import java.util.Locale;

/**
 * Filtro de pedidos por estado de pago para los contextos que tengan acceso
 * autorizado al historial consultado.
 */
public enum PedidoPagoFiltro {
    TODOS,
    PAGADO,
    CON_SALDO;

    public static PedidoPagoFiltro desde(String valor) {
        if (valor == null || valor.isBlank()) {
            return TODOS;
        }

        try {
            return PedidoPagoFiltro.valueOf(valor.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ReglaNegocioException("Estado de pago no valido");
        }
    }
}
