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
    private String clientBaseUrl = "http://localhost:4200";
    private List<String> manualAllowedMethods = new ArrayList<>();
    private MercadoPago mercadoPago = new MercadoPago();

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

    public String getClientBaseUrl() {
        return clientBaseUrl;
    }

    public void setClientBaseUrl(String clientBaseUrl) {
        this.clientBaseUrl = clientBaseUrl;
    }

    public List<String> getManualAllowedMethods() {
        return manualAllowedMethods;
    }

    public void setManualAllowedMethods(List<String> manualAllowedMethods) {
        this.manualAllowedMethods = manualAllowedMethods;
    }

    public MercadoPago getMercadoPago() {
        return mercadoPago;
    }

    public void setMercadoPago(MercadoPago mercadoPago) {
        this.mercadoPago = mercadoPago;
    }

    public static class MercadoPago {

        private String accessToken = "";
        private String publicKey = "";
        private String apiBaseUrl = "https://api.mercadopago.com";
        private String successUrl = "http://localhost:4200/carrito?checkout=confirmacion&payment=success";
        private String failureUrl = "http://localhost:4200/carrito?checkout=confirmacion&payment=failure";
        private String pendingUrl = "http://localhost:4200/carrito?checkout=confirmacion&payment=pending";
        private String notificationUrl = "";
        private String statementDescriptor = "REGALIA";
        private boolean sandboxMode = true;

        public String getAccessToken() {
            return accessToken;
        }

        public void setAccessToken(String accessToken) {
            this.accessToken = accessToken;
        }

        public String getPublicKey() {
            return publicKey;
        }

        public void setPublicKey(String publicKey) {
            this.publicKey = publicKey;
        }

        public String getApiBaseUrl() {
            return apiBaseUrl;
        }

        public void setApiBaseUrl(String apiBaseUrl) {
            this.apiBaseUrl = apiBaseUrl;
        }

        public String getSuccessUrl() {
            return successUrl;
        }

        public void setSuccessUrl(String successUrl) {
            this.successUrl = successUrl;
        }

        public String getFailureUrl() {
            return failureUrl;
        }

        public void setFailureUrl(String failureUrl) {
            this.failureUrl = failureUrl;
        }

        public String getPendingUrl() {
            return pendingUrl;
        }

        public void setPendingUrl(String pendingUrl) {
            this.pendingUrl = pendingUrl;
        }

        public String getNotificationUrl() {
            return notificationUrl;
        }

        public void setNotificationUrl(String notificationUrl) {
            this.notificationUrl = notificationUrl;
        }

        public String getStatementDescriptor() {
            return statementDescriptor;
        }

        public void setStatementDescriptor(String statementDescriptor) {
            this.statementDescriptor = statementDescriptor;
        }

        public boolean isSandboxMode() {
            return sandboxMode;
        }

        public void setSandboxMode(boolean sandboxMode) {
            this.sandboxMode = sandboxMode;
        }
    }
}
