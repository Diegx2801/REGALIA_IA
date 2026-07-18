package com.regalia.backend.checkout.application;

import com.regalia.backend.checkout.infrastructure.entity.CheckoutSessionEntity;
import com.regalia.backend.pago.application.gateway.PaymentGatewayProvider;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayVerificationResult;
import com.regalia.backend.pedido.application.PedidoService;
import com.regalia.backend.pedido.infrastructure.entity.PedidoEntity;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Aplica una confirmacion de pasarela ya verificada sin depender de Mercado Pago.
 */
@Service
@RequiredArgsConstructor
public class CheckoutPaymentConfirmationService {

    private final PedidoService pedidoService;

    public void confirmarPagoAprobado(
            CheckoutSessionEntity checkoutSession,
            PaymentGatewayVerificationResult paymentResult
    ) {
        validarProveedor(checkoutSession, paymentResult);

        CheckoutSessionOperacion operacion = CheckoutSessionOperacion.desde(
                checkoutSession.getTipoOperacion()
        );

        if (CheckoutSessionOperacion.PAGO_INICIAL.equals(operacion)) {
            PedidoEntity pedido = pedidoService.confirmarPedidoDesdeCheckoutSession(
                    checkoutSession,
                    paymentResult
            );
            checkoutSession.setPedido(pedido);
            return;
        }

        pedidoService.confirmarPagoRestanteDesdeCheckoutSession(checkoutSession, paymentResult);
    }

    private void validarProveedor(
            CheckoutSessionEntity checkoutSession,
            PaymentGatewayVerificationResult paymentResult
    ) {
        PaymentGatewayProvider proveedorSesion = PaymentGatewayProvider.from(
                checkoutSession.getProvider()
        );

        if (!proveedorSesion.equals(paymentResult.provider())) {
            throw new ReglaNegocioException("La pasarela del pago no coincide con la sesion de checkout");
        }
    }
}
