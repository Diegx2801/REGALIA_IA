package com.regalia.backend.auth.api;

import com.regalia.backend.auth.api.dto.LoginRequest;
import com.regalia.backend.auth.api.dto.LoginResponse;
import com.regalia.backend.auth.api.dto.GoogleLoginRequest;
import com.regalia.backend.auth.api.mapper.AuthApiMapper;
import com.regalia.backend.auth.application.AuthService;
import com.regalia.backend.auth.application.result.LoginResult;
import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.shared.web.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
        LoginResult result = authService.loginPublico(
                AuthApiMapper.toCommand(request),
                clientIpResolver.resolve(httpRequest),
                clientIpResolver.resolveUserAgent(httpRequest)
        );

        return ResponseEntity.ok(
                ApiResponse.success(AuthApiMapper.toResponse(result), "Inicio de sesi\u00f3n correcto")
        );
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<LoginResponse>> loginGoogle(
            @Valid @RequestBody GoogleLoginRequest request,
            HttpServletRequest httpRequest
    ) {
        LoginResult result = authService.loginGoogle(
                AuthApiMapper.toCommand(request),
                clientIpResolver.resolve(httpRequest),
                clientIpResolver.resolveUserAgent(httpRequest)
        );

        return ResponseEntity.ok(
                ApiResponse.success(AuthApiMapper.toResponse(result), "Inicio de sesi\u00f3n con Google correcto")
        );
    }

    @PostMapping("/session/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refrescarSesion(Authentication authentication) {
        LoginResult result = authService.refrescarSesionPublica(authentication.getName());

        return ResponseEntity.ok(
                ApiResponse.success(AuthApiMapper.toResponse(result), "Sesion actualizada correctamente")
        );
    }
}
