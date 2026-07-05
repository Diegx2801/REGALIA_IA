package com.regalia.backend.pago.infrastructure.gateway;

import com.regalia.backend.pago.application.gateway.PaymentGatewayClient;
import com.regalia.backend.pago.application.gateway.PaymentGatewayProvider;
import com.regalia.backend.pago.application.gateway.PaymentGatewayStatus;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayCheckoutCommand;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayCheckoutResult;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayVerificationCommand;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayVerificationResult;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Adaptador temporal para pagos verificados manualmente.
 * Sustituible por Niubiz, Culqi o Izipay sin tocar PedidoService.
 */
@Component
public class ManualPaymentGatewayClient implements PaymentGatewayClient {

    private final PaymentGatewayProperties properties;

    public ManualPaymentGatewayClient(PaymentGatewayProperties properties) {
        this.properties = properties;
    }

    @Override
    public PaymentGatewayProvider provider() {
        return PaymentGatewayProvider.MANUAL;
    }

    @Override
    public PaymentGatewayCheckoutResult createCheckout(PaymentGatewayCheckoutCommand command) {
        throw new ReglaNegocioException("El proveedor manual no crea sesiones externas de checkout");
    }

    @Override
    public PaymentGatewayVerificationResult verifyPayment(PaymentGatewayVerificationCommand command) {
        BigDecimal amount = normalizeAmount(command.amount());
        String paymentMethod = normalizePaymentMethod(command.paymentMethod());
        String transactionCode = normalizeTransactionCode(command.transactionCode());
        validateAllowedPaymentMethod(paymentMethod);

        return new PaymentGatewayVerificationResult(
                PaymentGatewayProvider.MANUAL,
                paymentMethod,
                transactionCode,
                amount,
                normalizeCurrency(command.currency()),
                PaymentGatewayStatus.APPROVED
        );
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ReglaNegocioException("El monto del pago debe ser mayor a cero");
        }

        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private String normalizePaymentMethod(String paymentMethod) {
        if (paymentMethod == null || paymentMethod.isBlank()) {
            throw new ReglaNegocioException("El metodo de pago es obligatorio");
        }

        return paymentMethod.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeTransactionCode(String transactionCode) {
        if (transactionCode == null || transactionCode.isBlank()) {
            throw new ReglaNegocioException("El codigo de transaccion es obligatorio");
        }

        return transactionCode.trim();
    }

    private String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return properties.getCurrency();
        }

        return currency.trim().toUpperCase(Locale.ROOT);
    }

    private void validateAllowedPaymentMethod(String paymentMethod) {
        Set<String> allowedMethods = properties.getManualAllowedMethods()
                .stream()
                .map(method -> method.trim().toUpperCase(Locale.ROOT))
                .collect(Collectors.toSet());

        if (!allowedMethods.contains(paymentMethod)) {
            throw new ReglaNegocioException("El metodo de pago manual no esta permitido");
        }
    }
}
