package com.regalia.backend.auth.api;

import com.regalia.backend.auth.api.dto.LoginRequest;
import com.regalia.backend.auth.api.dto.LoginResponse;
import com.regalia.backend.auth.application.AuthService;
import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.shared.web.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador REST para exponer endpoints de autenticacion.
 * API REST: un controlador expone endpoints HTTP y devuelve respuestas JSON para el cliente.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final ClientIpResolver clientIpResolver;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        LoginResponse response = authService.loginPublico(
                request,
                clientIpResolver.resolve(httpRequest),
                clientIpResolver.resolveUserAgent(httpRequest)
        );

        return ResponseEntity.ok(
                ApiResponse.success(response, "Inicio de sesi\u00f3n correcto")
        );
    }
}
