package com.regalia.backend.checkout.api;

import com.regalia.backend.checkout.api.dto.CheckoutSessionRequest;
import com.regalia.backend.checkout.api.dto.CheckoutSessionResponse;
import com.regalia.backend.checkout.application.CheckoutService;
import com.regalia.backend.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

/**
 * API autenticada para preparar operaciones de pago externas.
 */
@RestController
@RequestMapping("/api/checkout")
@RequiredArgsConstructor
public class CheckoutController {

    private final CheckoutService checkoutService;

    @PostMapping("/sessions")
    public ResponseEntity<ApiResponse<CheckoutSessionResponse>> crearSesionCheckout(
            Principal principal,
            @Valid @RequestBody CheckoutSessionRequest request
    ) {
        CheckoutSessionResponse response = checkoutService.crearSesionCheckout(
                principal.getName(),
                request
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Checkout preparado correctamente"));
    }

    @PostMapping("/orders/{idPedido}/remaining-payment-session")
    public ResponseEntity<ApiResponse<CheckoutSessionResponse>> crearSesionPagoRestante(
            Principal principal,
            @PathVariable Long idPedido
    ) {
        CheckoutSessionResponse response = checkoutService.crearSesionPagoRestante(
                principal.getName(),
                idPedido
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Sesion de pago preparada correctamente"));
    }
}
