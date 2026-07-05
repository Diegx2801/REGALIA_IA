package com.regalia.backend.pago.application.gateway;

import com.regalia.backend.pago.application.gateway.model.PaymentGatewayVerificationCommand;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayVerificationResult;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayCheckoutCommand;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayCheckoutResult;

/**
 * Puerto de salida para integrar pasarelas sin acoplar PedidoService a un proveedor concreto.
 */
public interface PaymentGatewayClient {

    PaymentGatewayProvider provider();

    PaymentGatewayCheckoutResult createCheckout(PaymentGatewayCheckoutCommand command);

    PaymentGatewayVerificationResult verifyPayment(PaymentGatewayVerificationCommand command);
}
