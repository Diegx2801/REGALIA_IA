package com.regalia.backend.pago.application.gateway;

import com.regalia.backend.pago.application.gateway.model.PaymentGatewayVerificationCommand;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayVerificationResult;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayCheckoutCommand;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayCheckoutResult;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Resuelve el cliente correcto de pasarela segun el proveedor configurado o solicitado.
 */
@Component
public class PaymentGatewayRegistry {

    private final Map<PaymentGatewayProvider, PaymentGatewayClient> clients;

    public PaymentGatewayRegistry(List<PaymentGatewayClient> clients) {
        this.clients = new EnumMap<>(PaymentGatewayProvider.class);
        clients.forEach(client -> this.clients.put(client.provider(), client));
    }

    public PaymentGatewayVerificationResult verifyPayment(PaymentGatewayVerificationCommand command) {
        PaymentGatewayProvider provider = command.provider() == null
                ? PaymentGatewayProvider.MANUAL
                : command.provider();

        PaymentGatewayClient client = clients.get(provider);

        if (client == null) {
            throw new ReglaNegocioException("La pasarela de pago solicitada no esta disponible");
        }

        return client.verifyPayment(command);
    }

    public PaymentGatewayCheckoutResult createCheckout(PaymentGatewayCheckoutCommand command) {
        PaymentGatewayProvider provider = command.provider() == null
                ? PaymentGatewayProvider.MANUAL
                : command.provider();

        PaymentGatewayClient client = clients.get(provider);

        if (client == null) {
            throw new ReglaNegocioException("La pasarela de pago solicitada no esta disponible");
        }

        return client.createCheckout(command);
    }
}
