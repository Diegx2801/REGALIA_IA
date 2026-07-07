package com.regalia.backend.checkout.api.dto;

/**
 * Payload minimo enviado por Mercado Pago para notificaciones de pago.
 */
public record MercadoPagoWebhookRequest(
        String type,
        String action,
        Data data
) {

    public String paymentId() {
        return data == null ? null : data.id();
    }

    public record Data(String id) {
    }
}
