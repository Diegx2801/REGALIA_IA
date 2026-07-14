package com.regalia.backend.usuariodocumento.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.usuariodocumento.api.dto.ConsultaRucResponse;
import com.regalia.backend.usuariodocumento.api.dto.RegistrarRucRequest;
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

    @GetMapping("/ruc/{numeroRuc}")
    public ResponseEntity<ApiResponse<ConsultaRucResponse>> consultarRuc(
            @PathVariable String numeroRuc
    ) {
        ConsultaRucResponse consulta = usuarioDocumentoService.consultarRuc(numeroRuc);

        return ResponseEntity.ok(ApiResponse.success(consulta));
    }

    @PostMapping("/ruc")
    public ResponseEntity<ApiResponse<UsuarioDocumentoResponse>> registrarRuc(
            Authentication authentication,
            @Valid @RequestBody RegistrarRucRequest request
    ) {
        UsuarioDocumentoResponse documento = usuarioDocumentoService.registrarRucPendiente(
                authentication.getName(),
                request
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(documento, "RUC registrado y enviado a revision administrativa"));
    }
}
