package com.regalia.backend.pago.application.gateway.model;

import com.regalia.backend.pago.application.gateway.PaymentGatewayProvider;

import java.math.BigDecimal;

/**
 * Comando interno para crear una sesion de pago externa.
 */
public record PaymentGatewayCheckoutCommand(
        PaymentGatewayProvider provider,
        BigDecimal amount,
        String currency,
        Long idUsuario,
        String payerEmail,
        Long idTienda,
        String storeName,
        String codigoTipoPago,
        String description
) {
}
