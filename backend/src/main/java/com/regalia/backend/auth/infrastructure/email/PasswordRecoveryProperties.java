package com.regalia.backend.auth.infrastructure.email;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.URISyntaxException;

/**
 * Configuracion del enlace publico y vigencia de los tokens de recuperacion.
 */
@Component
@ConfigurationProperties(prefix = "regalia.security.password-recovery")
public class PasswordRecoveryProperties {

    private String resetUrl = "http://localhost:3000/restablecer-contrasena";
    private int expirationMinutes = 30;

    public String getResetUrl() {
        return resetUrl;
    }

    public void setResetUrl(String resetUrl) {
        this.resetUrl = resetUrl;
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
            throw new IllegalStateException("La expiracion de recuperacion de contrasena debe ser mayor a cero");
        }

        if (!StringUtils.hasText(resetUrl)) {
            throw new IllegalStateException("La URL de recuperacion de contrasena es obligatoria");
        }

        try {
            URI uri = new URI(resetUrl.trim());
            if ((!"http".equalsIgnoreCase(uri.getScheme()) && !"https".equalsIgnoreCase(uri.getScheme()))
                    || !StringUtils.hasText(uri.getHost())
                    || StringUtils.hasText(uri.getQuery())
                    || StringUtils.hasText(uri.getFragment())) {
                throw new IllegalStateException(
                        "La URL de recuperacion debe ser una URL HTTP(S) absoluta sin query ni fragment"
                );
            }
        } catch (URISyntaxException exception) {
            throw new IllegalStateException("La URL de recuperacion de contrasena no es valida", exception);
        }
    }
}
