package com.regalia.backend.tipodocumento.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.tipodocumento.api.dto.TipoDocumentoResponse;
import com.regalia.backend.tipodocumento.application.TipoDocumentoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para consultar tipos de documento activos desde el contexto publico autenticado.
 */
@RestController
@RequestMapping("/api/tipos-documento")
@RequiredArgsConstructor
public class TipoDocumentoController {

    private final TipoDocumentoService tipoDocumentoService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TipoDocumentoResponse>>> listarActivos() {
        List<TipoDocumentoResponse> tiposDocumento = tipoDocumentoService.listarActivos();

        return ResponseEntity.ok(
                ApiResponse.success(tiposDocumento)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TipoDocumentoResponse>> buscarPorId(@PathVariable Long id) {
        TipoDocumentoResponse tipoDocumento = tipoDocumentoService.buscarPorId(id);

        return ResponseEntity.ok(
                ApiResponse.success(tipoDocumento)
        );
    }
}
