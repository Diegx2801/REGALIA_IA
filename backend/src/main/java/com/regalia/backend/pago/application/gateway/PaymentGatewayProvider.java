package com.regalia.backend.pago.application.gateway;

import com.regalia.backend.shared.exception.ReglaNegocioException;

import java.util.Locale;

/**
 * Proveedores de pago soportados por la capa de checkout.
 * MANUAL representa el flujo temporal del MVP mientras se integra una pasarela real.
 */
public enum PaymentGatewayProvider {
    MANUAL;

    public static PaymentGatewayProvider from(String value) {
        if (value == null || value.isBlank()) {
            return MANUAL;
        }

        try {
            return PaymentGatewayProvider.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ReglaNegocioException("La pasarela de pago solicitada no esta soportada");
        }
    }
}
