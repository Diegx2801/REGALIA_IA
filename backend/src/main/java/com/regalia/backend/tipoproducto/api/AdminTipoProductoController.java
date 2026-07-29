package com.regalia.backend.tipoproducto.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.tipoproducto.api.dto.TipoProductoResponse;
import com.regalia.backend.tipoproducto.application.TipoProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Controlador de consulta administrativa para tipos de producto controlados. */
@RestController
@RequestMapping("/api/admin/tipos-producto")
@RequiredArgsConstructor
public class AdminTipoProductoController {

    private final TipoProductoService tipoProductoService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TipoProductoResponse>>> listarTiposProductoAdministracion() {
        return ResponseEntity.ok(ApiResponse.success(tipoProductoService.listarTiposProductoAdministracion()));
    }

    @GetMapping("/{idTipoProducto}")
    public ResponseEntity<ApiResponse<TipoProductoResponse>> obtenerTipoProductoAdministracionPorId(@PathVariable Long idTipoProducto) {
        return ResponseEntity.ok(ApiResponse.success(tipoProductoService.obtenerTipoProductoAdministracionPorId(idTipoProducto)));
    }
}
