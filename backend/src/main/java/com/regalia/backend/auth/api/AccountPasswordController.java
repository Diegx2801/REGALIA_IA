package com.regalia.backend.auth.api;

import com.regalia.backend.auth.api.dto.ChangePasswordRequest;
import com.regalia.backend.auth.application.PasswordCredentialsService;
import com.regalia.backend.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Gestiona el cambio de contrasena de la cuenta autenticada.
 */
@RestController
@RequestMapping("/api/account/password")
@RequiredArgsConstructor
public class AccountPasswordController {

    private final PasswordCredentialsService passwordCredentialsService;

    @PutMapping
    public ResponseEntity<ApiResponse<Void>> cambiarContrasena(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        passwordCredentialsService.cambiarContrasena(
                authentication.getName(),
                request.contrasenaActual(),
                request.nuevaContrasena()
        );

        return ResponseEntity.ok(ApiResponse.success(
                null,
                "Contrasena actualizada. Por seguridad, inicia sesion nuevamente"
        ));
    }
}
