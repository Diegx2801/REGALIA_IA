package com.regalia.backend.auth.api;

import com.regalia.backend.auth.api.dto.EmailVerificationResponse;
import com.regalia.backend.auth.api.mapper.AuthApiMapper;
import com.regalia.backend.auth.application.EmailVerificationService;
import com.regalia.backend.auth.application.result.EmailVerificationResult;
import com.regalia.backend.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint publico para confirmar correos de cuentas locales.
 */
@RestController
@RequestMapping("/api/auth/email-verification")
@RequiredArgsConstructor
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;

    @GetMapping("/confirm")
    public ResponseEntity<ApiResponse<EmailVerificationResponse>> confirmarCorreo(
            @RequestParam String token
    ) {
        EmailVerificationResult result = emailVerificationService.confirmarCorreo(token);

        return ResponseEntity.ok(
                ApiResponse.success(
                        AuthApiMapper.toResponse(result),
                        "Correo verificado correctamente"
                )
        );
    }
}
