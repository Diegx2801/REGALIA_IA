package com.regalia.backend.checkout.application;

import com.regalia.backend.shared.exception.ReglaNegocioException;

import java.util.Locale;

/**
 * Diferencia una sesion que crea un pedido de una que cobra su saldo pendiente.
 */
public enum CheckoutSessionOperacion {
    PAGO_INICIAL,
    PAGO_RESTANTE;

    public static CheckoutSessionOperacion desde(String valor) {
        if (valor == null || valor.isBlank()) {
            return PAGO_INICIAL;
        }

        try {
            return CheckoutSessionOperacion.valueOf(valor.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ReglaNegocioException("La operacion de checkout no es valida");
        }
    }
}
