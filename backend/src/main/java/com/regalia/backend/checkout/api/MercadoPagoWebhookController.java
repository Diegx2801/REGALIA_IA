package com.regalia.backend.checkout.api;

import com.regalia.backend.checkout.api.dto.MercadoPagoWebhookRequest;
import com.regalia.backend.checkout.application.MercadoPagoWebhookService;
import com.regalia.backend.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/webhooks/mercado-pago")
@RequiredArgsConstructor
public class MercadoPagoWebhookController {

    private final MercadoPagoWebhookService mercadoPagoWebhookService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> recibirNotificacion(
            @RequestParam(name = "data.id", required = false) String paymentIdParam,
            @RequestBody(required = false) MercadoPagoWebhookRequest request
    ) {
        String paymentId = paymentIdParam;

        if (paymentId == null && request != null) {
            paymentId = request.paymentId();
        }

        mercadoPagoWebhookService.procesarPago(paymentId);

        return ResponseEntity.ok(
                ApiResponse.success(null, "Webhook Mercado Pago procesado correctamente")
        );
    }
}
