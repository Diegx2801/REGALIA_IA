package com.regalia.backend.checkout.application;

import com.regalia.backend.checkout.infrastructure.entity.CheckoutSessionEntity;
import com.regalia.backend.checkout.infrastructure.repository.CheckoutSessionJpaRepository;
import com.regalia.backend.pago.application.gateway.PaymentGatewayProvider;
import com.regalia.backend.pago.application.gateway.PaymentGatewayRegistry;
import com.regalia.backend.pago.application.gateway.PaymentGatewayStatus;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayVerificationCommand;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayVerificationResult;
import com.regalia.backend.pago.infrastructure.gateway.PaymentGatewayProperties;
import com.regalia.backend.pedido.application.PedidoService;
import com.regalia.backend.pedido.infrastructure.entity.PedidoEntity;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class MercadoPagoWebhookService {

    private final CheckoutSessionJpaRepository checkoutSessionRepository;
    private final PaymentGatewayRegistry paymentGatewayRegistry;
    private final PaymentGatewayProperties paymentGatewayProperties;
    private final PedidoService pedidoService;

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

        if (checkoutSession.getPedido() != null) {
            checkoutSession.setEstadoCheckout(CheckoutSessionEstado.APROBADA.name());
            return;
        }

        validarMontoYMoneda(checkoutSession, paymentResult);
        PedidoEntity pedido = pedidoService.confirmarPedidoDesdeCheckoutSession(
                checkoutSession,
                paymentResult
        );
        checkoutSession.setPedido(pedido);
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

    private void validarMontoYMoneda(
            CheckoutSessionEntity checkoutSession,
            PaymentGatewayVerificationResult paymentResult
    ) {
        BigDecimal montoEsperado = checkoutSession.getMontoInicial()
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal montoAprobado = paymentResult.amount()
                .setScale(2, RoundingMode.HALF_UP);

        if (montoEsperado.compareTo(montoAprobado) != 0) {
            checkoutSession.setEstadoCheckout(CheckoutSessionEstado.ERROR.name());
            throw new ReglaNegocioException(
                    "El monto aprobado no coincide con la sesion de checkout"
            );
        }

        if (!normalizarCodigo(checkoutSession.getMoneda())
                .equals(normalizarCodigo(paymentResult.currency()))) {
            checkoutSession.setEstadoCheckout(CheckoutSessionEstado.ERROR.name());
            throw new ReglaNegocioException(
                    "La moneda aprobada no coincide con la sesion de checkout"
            );
        }
    }

    private String normalizarTextoObligatorio(String texto, String mensajeError) {
        if (texto == null || texto.isBlank()) {
            throw new ReglaNegocioException(mensajeError);
        }

        return texto.trim();
    }

    private String normalizarCodigo(String codigo) {
        return normalizarTextoObligatorio(
                codigo,
                "El codigo interno requerido no esta configurado correctamente"
        ).toUpperCase(Locale.ROOT);
    }
}
