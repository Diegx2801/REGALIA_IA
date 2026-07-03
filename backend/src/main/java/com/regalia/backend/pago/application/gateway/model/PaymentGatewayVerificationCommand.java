package com.regalia.backend.pago.application.gateway.model;

import com.regalia.backend.pago.application.gateway.PaymentGatewayProvider;

import java.math.BigDecimal;

/**
 * Comando interno para verificar un pago contra la pasarela configurada.
 */
public record PaymentGatewayVerificationCommand(
        PaymentGatewayProvider provider,
        String paymentMethod,
        String transactionCode,
        BigDecimal amount,
        String currency,
        Long idUsuario,
        Long idTienda,
        Long idPedido,
        String codigoTipoPago
) {
}
