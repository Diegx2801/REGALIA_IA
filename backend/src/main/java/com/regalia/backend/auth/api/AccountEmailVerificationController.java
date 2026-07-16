package com.regalia.backend.auth.api;

import com.regalia.backend.auth.api.dto.EmailVerificationResponse;
import com.regalia.backend.auth.api.mapper.AuthApiMapper;
import com.regalia.backend.auth.application.EmailVerificationService;
import com.regalia.backend.auth.application.result.EmailVerificationResult;
import com.regalia.backend.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints autenticados para gestionar la verificacion del correo propio.
 */
@RestController
@RequestMapping("/api/account/email-verification")
@RequiredArgsConstructor
public class AccountEmailVerificationController {

    private final EmailVerificationService emailVerificationService;

    @PostMapping("/resend")
    public ResponseEntity<ApiResponse<EmailVerificationResponse>> reenviarVerificacion(
            Authentication authentication
    ) {
        EmailVerificationResult result = emailVerificationService.reenviarVerificacionCuentaLocal(
                authentication.getName()
        );

        String mensaje = result.verificado()
                ? "El correo ya se encuentra verificado"
                : "Enlace de verificacion reenviado";

        return ResponseEntity.ok(
                ApiResponse.success(
                        AuthApiMapper.toResponse(result),
                        mensaje
                )
        );
    }
}
