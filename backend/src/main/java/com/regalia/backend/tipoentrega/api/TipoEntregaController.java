package com.regalia.backend.tipoentrega.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.tipoentrega.api.dto.TipoEntregaRequest;
import com.regalia.backend.tipoentrega.api.dto.TipoEntregaResponse;
import com.regalia.backend.tipoentrega.application.TipoEntregaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para consultar y administrar tipos de entrega.
 */
@RestController
@RequestMapping("/api/tipos-entrega")
@RequiredArgsConstructor
public class TipoEntregaController {

    private final TipoEntregaService tipoEntregaService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TipoEntregaResponse>>> listarTiposEntregaActivos() {
        List<TipoEntregaResponse> tiposEntrega = tipoEntregaService.listarTiposEntregaActivos();

        return ResponseEntity.ok(
                ApiResponse.success(tiposEntrega)
        );
    }

    @GetMapping("/{idTipoEntrega}")
    public ResponseEntity<ApiResponse<TipoEntregaResponse>> obtenerTipoEntregaPorId(
            @PathVariable Long idTipoEntrega
    ) {
        TipoEntregaResponse tipoEntrega = tipoEntregaService.obtenerTipoEntregaPorId(idTipoEntrega);

        return ResponseEntity.ok(
                ApiResponse.success(tipoEntrega)
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TipoEntregaResponse>> crearTipoEntrega(
            @Valid @RequestBody TipoEntregaRequest request
    ) {
        TipoEntregaResponse tipoEntregaCreado = tipoEntregaService.crearTipoEntrega(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(tipoEntregaCreado, "Tipo de entrega creado correctamente"));
    }

    @PutMapping("/{idTipoEntrega}")
    public ResponseEntity<ApiResponse<TipoEntregaResponse>> actualizarTipoEntrega(
            @PathVariable Long idTipoEntrega,
            @Valid @RequestBody TipoEntregaRequest request
    ) {
        TipoEntregaResponse tipoEntregaActualizado = tipoEntregaService.actualizarTipoEntrega(
                idTipoEntrega,
                request
        );

        return ResponseEntity.ok(
                ApiResponse.success(tipoEntregaActualizado, "Tipo de entrega actualizado correctamente")
        );
    }

    @DeleteMapping("/{idTipoEntrega}")
    public ResponseEntity<ApiResponse<Void>> desactivarTipoEntrega(
            @PathVariable Long idTipoEntrega
    ) {
        tipoEntregaService.desactivarTipoEntrega(idTipoEntrega);

        return ResponseEntity.ok(
                ApiResponse.success(null, "Tipo de entrega desactivado correctamente")
        );
    }

    @PatchMapping("/{idTipoEntrega}/reactivar")
    public ResponseEntity<ApiResponse<TipoEntregaResponse>> reactivarTipoEntrega(
            @PathVariable Long idTipoEntrega
    ) {
        TipoEntregaResponse tipoEntregaReactivado = tipoEntregaService.reactivarTipoEntrega(idTipoEntrega);

        return ResponseEntity.ok(
                ApiResponse.success(tipoEntregaReactivado, "Tipo de entrega reactivado correctamente")
        );
    }
}