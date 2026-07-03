package com.regalia.backend.pago.infrastructure.gateway;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Configuracion comun para el modulo de pasarelas de pago.
 */
@Component
@ConfigurationProperties(prefix = "regalia.payments.gateway")
public class PaymentGatewayProperties {

    private String defaultProvider = "MANUAL";
    private String currency = "PEN";
    private List<String> manualAllowedMethods = new ArrayList<>();

    public String getDefaultProvider() {
        return defaultProvider;
    }

    public void setDefaultProvider(String defaultProvider) {
        this.defaultProvider = defaultProvider;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public List<String> getManualAllowedMethods() {
        return manualAllowedMethods;
    }

    public void setManualAllowedMethods(List<String> manualAllowedMethods) {
        this.manualAllowedMethods = manualAllowedMethods;
    }
}
