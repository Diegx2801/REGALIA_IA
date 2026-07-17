package com.regalia.backend.auth.api;

import com.regalia.backend.auth.api.dto.PasswordRecoveryRequest;
import com.regalia.backend.auth.api.dto.PasswordResetConfirmRequest;
import com.regalia.backend.auth.application.PasswordRecoveryService;
import com.regalia.backend.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints publicos de recuperacion. La solicitud siempre responde igual para
 * no revelar si un correo posee una cuenta local.
 */
@RestController
@RequestMapping("/api/auth/password-recovery")
@RequiredArgsConstructor
public class PasswordRecoveryController {

    private static final String MENSAJE_SOLICITUD =
            "Si existe una cuenta local asociada al correo, recibiras instrucciones para restablecer tu contrasena";

    private final PasswordRecoveryService passwordRecoveryService;

    @PostMapping("/request")
    public ResponseEntity<ApiResponse<Void>> solicitarRecuperacion(
            @Valid @RequestBody PasswordRecoveryRequest request
    ) {
        passwordRecoveryService.solicitarRecuperacion(request.correo());
        return ResponseEntity.ok(ApiResponse.success(null, MENSAJE_SOLICITUD));
    }

    @PostMapping("/reset")
    public ResponseEntity<ApiResponse<Void>> restablecerContrasena(
            @Valid @RequestBody PasswordResetConfirmRequest request
    ) {
        passwordRecoveryService.restablecerContrasena(request.token(), request.nuevaContrasena());
        return ResponseEntity.ok(ApiResponse.success(null, "Contrasena restablecida correctamente"));
    }
}
