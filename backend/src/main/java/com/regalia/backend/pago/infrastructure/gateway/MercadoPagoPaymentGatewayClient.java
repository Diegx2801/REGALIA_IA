package com.regalia.backend.pago.infrastructure.gateway;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.regalia.backend.pago.application.gateway.PaymentGatewayClient;
import com.regalia.backend.pago.application.gateway.PaymentGatewayProvider;
import com.regalia.backend.pago.application.gateway.PaymentGatewayStatus;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayCheckoutCommand;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayCheckoutResult;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayVerificationCommand;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayVerificationResult;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Adaptador de Mercado Pago Checkout Pro.
 * Crea preferencias de pago sin exponer credenciales al frontend.
 */
@Component
public class MercadoPagoPaymentGatewayClient implements PaymentGatewayClient {

    private final PaymentGatewayProperties properties;
    private final RestClient restClient;

    public MercadoPagoPaymentGatewayClient(PaymentGatewayProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.builder()
                .baseUrl(properties.getMercadoPago().getApiBaseUrl())
                .build();
    }

    @Override
    public PaymentGatewayProvider provider() {
        return PaymentGatewayProvider.MERCADO_PAGO;
    }

    @Override
    public PaymentGatewayCheckoutResult createCheckout(PaymentGatewayCheckoutCommand command) {
        String accessToken = normalizeAccessToken();
        BigDecimal amount = normalizeAmount(command.amount());
        String currency = normalizeCurrency(command.currency());
        String externalReference = buildExternalReference(command);

        MercadoPagoPreferenceResponse response = createPreference(
                accessToken,
                buildPreferencePayload(command, amount, currency, externalReference)
        );

        String redirectUrl = selectRedirectUrl(response);

        return new PaymentGatewayCheckoutResult(
                PaymentGatewayProvider.MERCADO_PAGO,
                response.id(),
                externalReference,
                amount,
                currency,
                response.initPoint(),
                response.sandboxInitPoint(),
                redirectUrl
        );
    }

    @Override
    public PaymentGatewayVerificationResult verifyPayment(PaymentGatewayVerificationCommand command) {
        String accessToken = normalizeAccessToken();
        String paymentId = normalizePaymentId(command.transactionCode());
        MercadoPagoPaymentResponse response = getPayment(accessToken, paymentId);

        return new PaymentGatewayVerificationResult(
                PaymentGatewayProvider.MERCADO_PAGO,
                normalizePaymentMethod(response.paymentMethodId()),
                normalizePaymentId(response.id()),
                normalizeAmount(response.transactionAmount()),
                normalizeCurrency(response.currencyId()),
                mapStatus(response.status()),
                normalizeOptional(response.externalReference()),
                normalizeOptional(response.statusDetail())
        );
    }

    private MercadoPagoPreferenceResponse createPreference(
            String accessToken,
            Map<String, Object> payload
    ) {
        try {
            MercadoPagoPreferenceResponse response = restClient.post()
                    .uri("/checkout/preferences")
                    .contentType(MediaType.APPLICATION_JSON)
                    .headers(headers -> headers.setBearerAuth(accessToken))
                    .body(payload)
                    .retrieve()
                    .body(MercadoPagoPreferenceResponse.class);

            if (response == null || !StringUtils.hasText(response.id())) {
                throw new ReglaNegocioException("Mercado Pago no devolvio una preferencia valida");
            }

            if (!StringUtils.hasText(response.initPoint())
                    && !StringUtils.hasText(response.sandboxInitPoint())) {
                throw new ReglaNegocioException("Mercado Pago no devolvio una URL de checkout valida");
            }

            return response;
        } catch (RestClientResponseException exception) {
            throw new ReglaNegocioException("No se pudo crear la preferencia de Mercado Pago");
        }
    }

    private MercadoPagoPaymentResponse getPayment(String accessToken, String paymentId) {
        try {
            MercadoPagoPaymentResponse response = restClient.get()
                    .uri("/v1/payments/{paymentId}", paymentId)
                    .headers(headers -> headers.setBearerAuth(accessToken))
                    .retrieve()
                    .body(MercadoPagoPaymentResponse.class);

            if (response == null || response.id() == null) {
                throw new ReglaNegocioException("Mercado Pago no devolvio un pago valido");
            }

            return response;
        } catch (RestClientResponseException exception) {
            throw new ReglaNegocioException("No se pudo verificar el pago de Mercado Pago");
        }
    }

    private Map<String, Object> buildPreferencePayload(
            PaymentGatewayCheckoutCommand command,
            BigDecimal amount,
            String currency,
            String externalReference
    ) {
        PaymentGatewayProperties.MercadoPago mercadoPago = properties.getMercadoPago();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("items", List.of(buildItem(command, amount, currency)));
        payload.put("payer", Map.of("email", normalizeEmail(command.payerEmail())));
        payload.put("back_urls", Map.of(
                "success", mercadoPago.getSuccessUrl(),
                "failure", mercadoPago.getFailureUrl(),
                "pending", mercadoPago.getPendingUrl()
        ));
        payload.put("auto_return", "approved");
        payload.put("external_reference", externalReference);

        if (StringUtils.hasText(mercadoPago.getStatementDescriptor())) {
            payload.put("statement_descriptor", mercadoPago.getStatementDescriptor().trim());
        }

        if (StringUtils.hasText(mercadoPago.getNotificationUrl())) {
            payload.put("notification_url", mercadoPago.getNotificationUrl().trim());
        }

        return payload;
    }

    private Map<String, Object> buildItem(
            PaymentGatewayCheckoutCommand command,
            BigDecimal amount,
            String currency
    ) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("title", buildTitle(command.storeName()));
        item.put("description", normalizeDescription(command.description()));
        item.put("quantity", 1);
        item.put("currency_id", currency);
        item.put("unit_price", amount);

        return item;
    }

    private String selectRedirectUrl(MercadoPagoPreferenceResponse response) {
        if (properties.getMercadoPago().isSandboxMode()
                && StringUtils.hasText(response.sandboxInitPoint())) {
            return response.sandboxInitPoint().trim();
        }

        if (StringUtils.hasText(response.initPoint())) {
            return response.initPoint().trim();
        }

        return response.sandboxInitPoint().trim();
    }

    private String normalizeAccessToken() {
        String accessToken = properties.getMercadoPago().getAccessToken();

        if (!StringUtils.hasText(accessToken)) {
            throw new ReglaNegocioException("El Access Token de Mercado Pago no esta configurado");
        }

        return accessToken.trim();
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ReglaNegocioException("El monto del checkout debe ser mayor a cero");
        }

        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private String normalizeCurrency(String currency) {
        String value = StringUtils.hasText(currency) ? currency : properties.getCurrency();
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeEmail(String email) {
        if (!StringUtils.hasText(email)) {
            throw new ReglaNegocioException("El correo del pagador es obligatorio");
        }

        return email.trim();
    }

    private String normalizeDescription(String description) {
        if (!StringUtils.hasText(description)) {
            return "Reserva de producto en REGALIA";
        }

        return description.trim();
    }

    private String buildTitle(String storeName) {
        if (!StringUtils.hasText(storeName)) {
            return "Reserva REGALIA";
        }

        return "Reserva REGALIA - " + storeName.trim();
    }

    private String buildExternalReference(PaymentGatewayCheckoutCommand command) {
        if (!StringUtils.hasText(command.externalReference())) {
            throw new ReglaNegocioException("La referencia externa del checkout es obligatoria");
        }

        return command.externalReference().trim();
    }

    private String normalizePaymentId(String paymentId) {
        if (!StringUtils.hasText(paymentId)) {
            throw new ReglaNegocioException("El identificador del pago de Mercado Pago es obligatorio");
        }

        return paymentId.trim();
    }

    private String normalizePaymentId(Object paymentId) {
        if (paymentId == null) {
            throw new ReglaNegocioException("El identificador del pago de Mercado Pago es obligatorio");
        }

        return normalizePaymentId(String.valueOf(paymentId));
    }

    private String normalizePaymentMethod(String paymentMethod) {
        if (!StringUtils.hasText(paymentMethod)) {
            return "MERCADO_PAGO";
        }

        return paymentMethod.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeOptional(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        return value.trim();
    }

    private PaymentGatewayStatus mapStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return PaymentGatewayStatus.PENDING;
        }

        return switch (status.trim().toLowerCase(Locale.ROOT)) {
            case "approved" -> PaymentGatewayStatus.APPROVED;
            case "rejected", "cancelled", "refunded", "charged_back" -> PaymentGatewayStatus.REJECTED;
            default -> PaymentGatewayStatus.PENDING;
        };
    }

    private record MercadoPagoPreferenceResponse(
            @JsonProperty("id") String id,
            @JsonProperty("init_point") String initPoint,
            @JsonProperty("sandbox_init_point") String sandboxInitPoint
    ) {
    }

    private record MercadoPagoPaymentResponse(
            @JsonProperty("id") Object id,
            @JsonProperty("status") String status,
            @JsonProperty("status_detail") String statusDetail,
            @JsonProperty("transaction_amount") BigDecimal transactionAmount,
            @JsonProperty("currency_id") String currencyId,
            @JsonProperty("payment_method_id") String paymentMethodId,
            @JsonProperty("external_reference") String externalReference
    ) {
    }
}
