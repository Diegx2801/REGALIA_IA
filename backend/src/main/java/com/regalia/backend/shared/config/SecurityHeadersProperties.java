package com.regalia.backend.shared.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Propiedades centralizadas para cabeceras HTTP de seguridad.
 */
@Component
@ConfigurationProperties(prefix = "regalia.security.headers")
public class SecurityHeadersProperties {

    private String referrerPolicy = "strict-origin-when-cross-origin";
    private String permissionsPolicy = "camera=(), microphone=(), geolocation=(), payment=()";
    private boolean hstsEnabled = false;
    private long hstsMaxAgeSeconds = 31536000;
    private boolean hstsIncludeSubdomains = true;

    public String getReferrerPolicy() {
        return referrerPolicy;
    }

    public void setReferrerPolicy(String referrerPolicy) {
        this.referrerPolicy = referrerPolicy;
    }

    public String getPermissionsPolicy() {
        return permissionsPolicy;
    }

    public void setPermissionsPolicy(String permissionsPolicy) {
        this.permissionsPolicy = permissionsPolicy;
    }

    public boolean isHstsEnabled() {
        return hstsEnabled;
    }

    public void setHstsEnabled(boolean hstsEnabled) {
        this.hstsEnabled = hstsEnabled;
    }

    public long getHstsMaxAgeSeconds() {
        return hstsMaxAgeSeconds;
    }

    public void setHstsMaxAgeSeconds(long hstsMaxAgeSeconds) {
        this.hstsMaxAgeSeconds = hstsMaxAgeSeconds;
    }

    public boolean isHstsIncludeSubdomains() {
        return hstsIncludeSubdomains;
    }

    public void setHstsIncludeSubdomains(boolean hstsIncludeSubdomains) {
        this.hstsIncludeSubdomains = hstsIncludeSubdomains;
    }
}
