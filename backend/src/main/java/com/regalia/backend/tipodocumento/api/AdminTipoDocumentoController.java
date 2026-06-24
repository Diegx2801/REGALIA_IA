package com.regalia.backend.tipodocumento.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.tipodocumento.api.dto.TipoDocumentoRequest;
import com.regalia.backend.tipodocumento.api.dto.TipoDocumentoResponse;
import com.regalia.backend.tipodocumento.application.TipoDocumentoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST administrativo para gestionar tipos de documento.
 */
@RestController
@RequestMapping("/api/admin/tipos-documento")
@RequiredArgsConstructor
public class AdminTipoDocumentoController {

    private final TipoDocumentoService tipoDocumentoService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TipoDocumentoResponse>>> listarTiposDocumentoAdministracion() {
        List<TipoDocumentoResponse> tiposDocumento = tipoDocumentoService.listarTiposDocumentoAdministracion();

        return ResponseEntity.ok(
                ApiResponse.success(tiposDocumento)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TipoDocumentoResponse>> buscarTipoDocumentoAdministracionPorId(
            @PathVariable Long id
    ) {
        TipoDocumentoResponse tipoDocumento = tipoDocumentoService.buscarTipoDocumentoAdministracionPorId(id);

        return ResponseEntity.ok(
                ApiResponse.success(tipoDocumento)
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TipoDocumentoResponse>> crear(
            @Valid @RequestBody TipoDocumentoRequest request
    ) {
        TipoDocumentoResponse tipoDocumentoCreado = tipoDocumentoService.crear(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(tipoDocumentoCreado, "Tipo de documento creado correctamente"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TipoDocumentoResponse>> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody TipoDocumentoRequest request
    ) {
        TipoDocumentoResponse tipoDocumentoActualizado = tipoDocumentoService.actualizar(id, request);

        return ResponseEntity.ok(
                ApiResponse.success(tipoDocumentoActualizado, "Tipo de documento actualizado correctamente")
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> desactivar(@PathVariable Long id) {
        tipoDocumentoService.desactivar(id);

        return ResponseEntity.ok(
                ApiResponse.success(null, "Tipo de documento desactivado correctamente")
        );
    }

    @PatchMapping("/{id}/reactivar")
    public ResponseEntity<ApiResponse<TipoDocumentoResponse>> reactivar(@PathVariable Long id) {
        TipoDocumentoResponse tipoDocumentoReactivado = tipoDocumentoService.reactivar(id);

        return ResponseEntity.ok(
                ApiResponse.success(tipoDocumentoReactivado, "Tipo de documento reactivado correctamente")
        );
    }
}
