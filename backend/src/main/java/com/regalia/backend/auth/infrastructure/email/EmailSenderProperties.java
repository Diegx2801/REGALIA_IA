package com.regalia.backend.auth.infrastructure.email;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuracion comun del proveedor de correo saliente.
 */
@Component
@ConfigurationProperties(prefix = "regalia.email")
public class EmailSenderProperties {

    private String provider = "LOG";
    private String fromAddress = "no-reply@regalia.local";
    private String fromName = "REGALIA";

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getFromAddress() {
        return fromAddress;
    }

    public void setFromAddress(String fromAddress) {
        this.fromAddress = fromAddress;
    }

    public String getFromName() {
        return fromName;
    }

    public void setFromName(String fromName) {
        this.fromName = fromName;
    }
}
