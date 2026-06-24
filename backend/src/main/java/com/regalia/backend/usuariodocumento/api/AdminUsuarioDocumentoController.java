package com.regalia.backend.usuariodocumento.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.usuariodocumento.api.dto.AdminUsuarioDocumentoResponse;
import com.regalia.backend.usuariodocumento.application.UsuarioDocumentoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST administrativo para revisar solicitudes de verificación de documentos.
 *
 */
@RestController
@RequestMapping("/api/admin/usuarios-documentos")
@RequiredArgsConstructor
public class AdminUsuarioDocumentoController {

    private final UsuarioDocumentoService usuarioDocumentoService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminUsuarioDocumentoResponse>>> listarDocumentosParaRevision(
            @RequestParam(required = false) String estadoVerificacion
    ) {
        List<AdminUsuarioDocumentoResponse> documentos = usuarioDocumentoService
                .listarDocumentosParaRevision(estadoVerificacion);

        return ResponseEntity.ok(
                ApiResponse.success(documentos)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminUsuarioDocumentoResponse>> obtenerDocumentoParaRevision(@PathVariable Long id) {
        AdminUsuarioDocumentoResponse documento = usuarioDocumentoService.obtenerDocumentoParaRevision(id);

        return ResponseEntity.ok(
                ApiResponse.success(documento)
        );
    }

    @PatchMapping("/{id}/verificar")
    public ResponseEntity<ApiResponse<AdminUsuarioDocumentoResponse>> verificarDocumento(@PathVariable Long id) {
        AdminUsuarioDocumentoResponse documentoVerificado = usuarioDocumentoService.verificarDocumento(id);

        return ResponseEntity.ok(
                ApiResponse.success(documentoVerificado, "Documento verificado correctamente")
        );
    }

    @PatchMapping("/{id}/observar")
    public ResponseEntity<ApiResponse<AdminUsuarioDocumentoResponse>> observarDocumento(@PathVariable Long id) {
        AdminUsuarioDocumentoResponse documentoObservado = usuarioDocumentoService.observarDocumento(id);

        return ResponseEntity.ok(
                ApiResponse.success(documentoObservado, "Solicitud de verificación observada correctamente")
        );
    }

    @PatchMapping("/{id}/rechazar")
    public ResponseEntity<ApiResponse<AdminUsuarioDocumentoResponse>> rechazarDocumento(@PathVariable Long id) {
        AdminUsuarioDocumentoResponse documentoRechazado = usuarioDocumentoService.rechazarDocumento(id);

        return ResponseEntity.ok(
                ApiResponse.success(documentoRechazado, "Solicitud de verificación rechazada correctamente")
        );
    }
}
