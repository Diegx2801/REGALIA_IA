package com.regalia.backend.pago.application.gateway;

import com.regalia.backend.pago.application.gateway.model.PaymentGatewayVerificationCommand;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayVerificationResult;

/**
 * Puerto de salida para integrar pasarelas sin acoplar PedidoService a un proveedor concreto.
 */
public interface PaymentGatewayClient {

    PaymentGatewayProvider provider();

    PaymentGatewayVerificationResult verifyPayment(PaymentGatewayVerificationCommand command);
}
