package com.regalia.backend.pago.application.gateway.model;

/**
 * URLs de retorno decididas por el caso de uso, no por el navegador.
 */
public record PaymentGatewayRedirectUrls(
        String successUrl,
        String failureUrl,
        String pendingUrl
) {
}
