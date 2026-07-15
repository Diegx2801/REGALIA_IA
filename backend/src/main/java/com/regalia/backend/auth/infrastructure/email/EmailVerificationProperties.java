package com.regalia.backend.auth.infrastructure.email;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuracion del flujo de verificacion de correo para cuentas locales.
 */
@Component
@ConfigurationProperties(prefix = "regalia.security.email-verification")
public class EmailVerificationProperties {

    private String confirmationUrl = "http://localhost:8080/api/auth/email-verification/confirm";
    private int expirationMinutes = 1440;

    public String getConfirmationUrl() {
        return confirmationUrl;
    }

    public void setConfirmationUrl(String confirmationUrl) {
        this.confirmationUrl = confirmationUrl;
    }

    public int getExpirationMinutes() {
        return expirationMinutes;
    }

    public void setExpirationMinutes(int expirationMinutes) {
        this.expirationMinutes = expirationMinutes;
    }
}
