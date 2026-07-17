package com.regalia.backend.auth.infrastructure.email;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.net.URISyntaxException;

/**
 * Configuracion del flujo de verificacion de correo para cuentas locales.
 */
@Component
@ConfigurationProperties(prefix = "regalia.security.email-verification")
public class EmailVerificationProperties {

    private String confirmationUrl = "http://localhost:3000/verificar-correo";
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

    @PostConstruct
    void validate() {
        if (expirationMinutes < 1) {
            throw new IllegalStateException("La expiracion de verificacion de correo debe ser mayor a cero");
        }

        if (!StringUtils.hasText(confirmationUrl)) {
            throw new IllegalStateException("La URL de confirmacion de correo es obligatoria");
        }

        try {
            URI uri = new URI(confirmationUrl.trim());

            if ((!"http".equalsIgnoreCase(uri.getScheme()) && !"https".equalsIgnoreCase(uri.getScheme()))
                    || !StringUtils.hasText(uri.getHost())
                    || StringUtils.hasText(uri.getQuery())
                    || StringUtils.hasText(uri.getFragment())) {
                throw new IllegalStateException(
                        "La URL de confirmacion debe ser una URL HTTP(S) absoluta sin query ni fragment"
                );
            }
        } catch (URISyntaxException exception) {
            throw new IllegalStateException("La URL de confirmacion de correo no es valida", exception);
        }
    }
}
