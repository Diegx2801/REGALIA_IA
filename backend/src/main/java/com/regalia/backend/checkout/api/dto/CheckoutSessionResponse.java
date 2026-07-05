package com.regalia.backend.checkout.api.dto;

import java.math.BigDecimal;

/**
 * Datos necesarios para redirigir al usuario a la pasarela externa.
 */
public record CheckoutSessionResponse(
        String provider,
        String preferenceId,
        String externalReference,
        BigDecimal amount,
        String currency,
        String initPoint,
        String sandboxInitPoint,
        String redirectUrl
) {
}
