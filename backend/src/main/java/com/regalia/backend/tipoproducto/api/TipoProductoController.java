package com.regalia.backend.tipoproducto.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.tipoproducto.api.dto.TipoProductoResponse;
import com.regalia.backend.tipoproducto.application.TipoProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST publico para consultar tipos de producto activos.
 */
@RestController
@RequestMapping("/api/tipos-producto")
@RequiredArgsConstructor
public class TipoProductoController {

    private final TipoProductoService tipoProductoService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TipoProductoResponse>>> listarTiposProductoActivos() {
        List<TipoProductoResponse> tiposProducto = tipoProductoService.listarTiposProductoActivos();

        return ResponseEntity.ok(
                ApiResponse.success(tiposProducto)
        );
    }

    @GetMapping("/{idTipoProducto}")
    public ResponseEntity<ApiResponse<TipoProductoResponse>> obtenerTipoProductoPorId(
            @PathVariable Long idTipoProducto
    ) {
        TipoProductoResponse tipoProducto = tipoProductoService.obtenerTipoProductoPorId(idTipoProducto);

        return ResponseEntity.ok(
                ApiResponse.success(tipoProducto)
        );
    }
}
