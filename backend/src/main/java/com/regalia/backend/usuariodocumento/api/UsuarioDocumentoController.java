package com.regalia.backend.usuariodocumento.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.usuariodocumento.api.dto.UsuarioDocumentoRequest;
import com.regalia.backend.usuariodocumento.api.dto.UsuarioDocumentoResponse;
import com.regalia.backend.usuariodocumento.application.UsuarioDocumentoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para gestionar documentos del usuario autenticado.
 */
@RestController
@RequestMapping("/api/usuarios/me/documentos")
@RequiredArgsConstructor
public class UsuarioDocumentoController {

    private final UsuarioDocumentoService usuarioDocumentoService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UsuarioDocumentoResponse>>> listarMisDocumentos(Authentication authentication) {
        List<UsuarioDocumentoResponse> documentos = usuarioDocumentoService.listarMisDocumentos(authentication.getName());

        return ResponseEntity.ok(
                ApiResponse.success(documentos)
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UsuarioDocumentoResponse>> registrarDocumento(
            Authentication authentication,
            @Valid @RequestBody UsuarioDocumentoRequest request
    ) {
        UsuarioDocumentoResponse documentoRegistrado = usuarioDocumentoService.registrarDocumento(authentication.getName(), request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(documentoRegistrado, "Solicitud de verificación enviada correctamente"));
    }
}