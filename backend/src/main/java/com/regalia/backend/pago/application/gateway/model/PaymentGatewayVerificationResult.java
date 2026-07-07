package com.regalia.backend.pago.application.gateway.model;

import com.regalia.backend.pago.application.gateway.PaymentGatewayProvider;
import com.regalia.backend.pago.application.gateway.PaymentGatewayStatus;

import java.math.BigDecimal;

/**
 * Resultado interno normalizado de la verificacion de un pago.
 */
public record PaymentGatewayVerificationResult(
        PaymentGatewayProvider provider,
        String paymentMethod,
        String transactionCode,
        BigDecimal amount,
        String currency,
        PaymentGatewayStatus status,
        String externalReference,
        String statusDetail
) {
}
