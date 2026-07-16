package com.regalia.backend.auth.api;

import com.regalia.backend.auth.api.dto.EmailVerificationResponse;
import com.regalia.backend.auth.api.dto.EmailVerificationConfirmRequest;
import com.regalia.backend.auth.api.mapper.AuthApiMapper;
import com.regalia.backend.auth.application.EmailVerificationService;
import com.regalia.backend.auth.application.result.EmailVerificationResult;
import com.regalia.backend.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

/**
 * Endpoint publico para confirmar correos de cuentas locales.
 */
@RestController
@RequestMapping("/api/auth/email-verification")
@RequiredArgsConstructor
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;

    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<EmailVerificationResponse>> confirmarCorreo(
            @Valid @RequestBody EmailVerificationConfirmRequest request
    ) {
        EmailVerificationResult result = emailVerificationService.confirmarCorreo(request.token());

        return ResponseEntity.ok(
                ApiResponse.success(
                        AuthApiMapper.toResponse(result),
                        "Correo verificado correctamente"
                )
        );
    }
}
