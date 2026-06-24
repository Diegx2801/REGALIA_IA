package com.regalia.backend.auth.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Propiedades centralizadas para la emision y validacion de tokens JWT.
 */
@Component
@ConfigurationProperties(prefix = "regalia.security.jwt")
public class JwtProperties {

    private String secret;
    private String issuer = "regalia-backend";
    private String audience = "regalia-api";
    private Long publicExpirationMinutes = 240L;
    private Long adminExpirationMinutes = 30L;

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }

    public String getAudience() {
        return audience;
    }

    public void setAudience(String audience) {
        this.audience = audience;
    }

    public Long getPublicExpirationMinutes() {
        return publicExpirationMinutes;
    }

    public void setPublicExpirationMinutes(Long publicExpirationMinutes) {
        this.publicExpirationMinutes = publicExpirationMinutes;
    }

    public Long getAdminExpirationMinutes() {
        return adminExpirationMinutes;
    }

    public void setAdminExpirationMinutes(Long adminExpirationMinutes) {
        this.adminExpirationMinutes = adminExpirationMinutes;
    }

    public Long obtenerExpirationMinutes(AuthContext authContext) {
        if (AuthContext.ADMIN.equals(authContext)) {
            return adminExpirationMinutes;
        }

        return publicExpirationMinutes;
    }
}
