package com.regalia.backend.checkout.application;

import com.regalia.backend.checkout.infrastructure.entity.CheckoutSessionEntity;
import com.regalia.backend.checkout.infrastructure.repository.CheckoutSessionJpaRepository;
import com.regalia.backend.pago.application.gateway.PaymentGatewayProvider;
import com.regalia.backend.pago.application.gateway.PaymentGatewayRegistry;
import com.regalia.backend.pago.application.gateway.PaymentGatewayStatus;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayVerificationCommand;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayVerificationResult;
import com.regalia.backend.pago.infrastructure.gateway.PaymentGatewayProperties;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class MercadoPagoWebhookService {

    private final CheckoutSessionJpaRepository checkoutSessionRepository;
    private final PaymentGatewayRegistry paymentGatewayRegistry;
    private final PaymentGatewayProperties paymentGatewayProperties;
    private final CheckoutPaymentConfirmationService checkoutPaymentConfirmationService;

    @Transactional
    public void procesarPago(String paymentId) {
        String paymentIdNormalizado = normalizarTextoObligatorio(
                paymentId,
                "El identificador del pago es obligatorio"
        );

        PaymentGatewayVerificationResult paymentResult = paymentGatewayRegistry.verifyPayment(
                new PaymentGatewayVerificationCommand(
                        PaymentGatewayProvider.MERCADO_PAGO,
                        null,
                        paymentIdNormalizado,
                        null,
                        paymentGatewayProperties.getCurrency(),
                        null,
                        null,
                        null,
                        null
                )
        );

        String externalReference = normalizarTextoObligatorio(
                paymentResult.externalReference(),
                "El pago no tiene referencia externa de REGALIA"
        );

        CheckoutSessionEntity checkoutSession = obtenerCheckoutSessionBloqueadaConDetalle(
                externalReference
        );

        validarPagoNoUsadoPorOtraSesion(paymentResult.transactionCode(), checkoutSession);
        registrarEstadoPasarela(checkoutSession, paymentResult);

        if (PaymentGatewayStatus.PENDING.equals(paymentResult.status())) {
            checkoutSession.setEstadoCheckout(CheckoutSessionEstado.PENDIENTE.name());
            return;
        }

        if (PaymentGatewayStatus.REJECTED.equals(paymentResult.status())) {
            checkoutSession.setEstadoCheckout(CheckoutSessionEstado.RECHAZADA.name());
            return;
        }

        if (CheckoutSessionEstado.APROBADA.name().equals(checkoutSession.getEstadoCheckout())) {
            checkoutSession.setEstadoCheckout(CheckoutSessionEstado.APROBADA.name());
            return;
        }

        checkoutPaymentConfirmationService.confirmarPagoAprobado(
                checkoutSession,
                paymentResult
        );
        checkoutSession.setEstadoCheckout(CheckoutSessionEstado.APROBADA.name());
    }

    private CheckoutSessionEntity obtenerCheckoutSessionBloqueadaConDetalle(String externalReference) {
        checkoutSessionRepository.findActivaPorExternalReferenceParaActualizar(externalReference)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontro la sesion de checkout asociada al pago"
                ));

        return checkoutSessionRepository.findActivaPorExternalReferenceConDetalle(externalReference)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontro la sesion de checkout asociada al pago"
                ));
    }

    private void registrarEstadoPasarela(
            CheckoutSessionEntity checkoutSession,
            PaymentGatewayVerificationResult paymentResult
    ) {
        checkoutSession.setPaymentId(paymentResult.transactionCode());
        checkoutSession.setEstadoPago(paymentResult.status().name());
        checkoutSession.setProviderStatusDetail(paymentResult.statusDetail());
    }

    private void validarPagoNoUsadoPorOtraSesion(
            String paymentId,
            CheckoutSessionEntity checkoutSession
    ) {
        checkoutSessionRepository.findByPaymentIdAndEstadoTrue(paymentId)
                .filter(session -> !Objects.equals(
                        session.getIdCheckoutSession(),
                        checkoutSession.getIdCheckoutSession()
                ))
                .ifPresent(session -> {
                    throw new ReglaNegocioException("El pago ya fue procesado por otra sesion");
                });
    }

    private String normalizarTextoObligatorio(String texto, String mensajeError) {
        if (texto == null || texto.isBlank()) {
            throw new ReglaNegocioException(mensajeError);
        }

        return texto.trim();
    }

}
