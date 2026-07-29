package com.regalia.backend.tipoentrega.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.tipoentrega.api.dto.TipoEntregaResponse;
import com.regalia.backend.tipoentrega.application.TipoEntregaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Controlador de consulta administrativa para modalidades de entrega controladas. */
@RestController
@RequestMapping("/api/admin/tipos-entrega")
@RequiredArgsConstructor
public class AdminTipoEntregaController {

    private final TipoEntregaService tipoEntregaService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TipoEntregaResponse>>> listarTiposEntregaAdministracion() {
        return ResponseEntity.ok(ApiResponse.success(tipoEntregaService.listarTiposEntregaAdministracion()));
    }

    @GetMapping("/{idTipoEntrega}")
    public ResponseEntity<ApiResponse<TipoEntregaResponse>> obtenerTipoEntregaAdministracionPorId(@PathVariable Long idTipoEntrega) {
        return ResponseEntity.ok(ApiResponse.success(tipoEntregaService.obtenerTipoEntregaAdministracionPorId(idTipoEntrega)));
    }
}
