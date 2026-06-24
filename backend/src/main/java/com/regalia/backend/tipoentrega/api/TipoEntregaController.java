package com.regalia.backend.tipoentrega.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.tipoentrega.api.dto.TipoEntregaResponse;
import com.regalia.backend.tipoentrega.application.TipoEntregaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST publico para consultar tipos de entrega activos.
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
}
