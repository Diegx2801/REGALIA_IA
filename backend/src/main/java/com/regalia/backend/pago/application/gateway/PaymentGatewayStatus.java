package com.regalia.backend.pago.application.gateway;

/**
 * Estados normalizados que REGALIA entiende sin depender del vocabulario de cada pasarela.
 */
public enum PaymentGatewayStatus {
    APPROVED,
    REJECTED,
    PENDING
}
