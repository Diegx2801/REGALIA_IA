package com.regalia.backend.pago.application.gateway.model;

import com.regalia.backend.pago.application.gateway.PaymentGatewayProvider;

import java.math.BigDecimal;

/**
 * Resultado normalizado de una pasarela para redireccionar al checkout.
 */
public record PaymentGatewayCheckoutResult(
        PaymentGatewayProvider provider,
        String preferenceId,
        String externalReference,
        BigDecimal amount,
        String currency,
        String initPoint,
        String sandboxInitPoint,
        String redirectUrl
) {
}
