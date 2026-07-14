package com.regalia.backend.auth.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Propiedades centralizadas para validar ID tokens emitidos por Google.
 */
@Component
@ConfigurationProperties(prefix = "regalia.security.oauth.google")
public class GoogleOAuthProperties {

    private String clientId;
    private String issuer = "https://accounts.google.com";

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank()
                && issuer != null && !issuer.isBlank();
    }
}
