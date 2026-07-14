package com.regalia.backend.auth.api;

import com.regalia.backend.auth.api.dto.GoogleIdentityLinkRequest;
import com.regalia.backend.auth.api.dto.GoogleIdentityLinkResponse;
import com.regalia.backend.auth.application.AccountIdentityService;
import com.regalia.backend.auth.application.result.GoogleIdentityLinkResult;
import com.regalia.backend.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints para gestionar metodos de acceso de una cuenta autenticada.
 */
@RestController
@RequestMapping("/api/account/identities")
@RequiredArgsConstructor
public class AccountIdentityController {

    private final AccountIdentityService accountIdentityService;

    @PostMapping("/google/link")
    public ResponseEntity<ApiResponse<GoogleIdentityLinkResponse>> vincularGoogle(
            Authentication authentication,
            @Valid @RequestBody GoogleIdentityLinkRequest request
    ) {
        GoogleIdentityLinkResult result = accountIdentityService.vincularGoogle(
                authentication.getName(),
                request.idToken()
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        new GoogleIdentityLinkResponse(
                                result.proveedor(),
                                result.correo(),
                                result.vinculada()
                        ),
                        "Cuenta de Google vinculada correctamente"
                )
        );
    }
}
