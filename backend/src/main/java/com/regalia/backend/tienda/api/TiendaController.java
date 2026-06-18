package com.regalia.backend.tienda.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.tienda.api.dto.TiendaPublicaDetalleResponse;
import com.regalia.backend.tienda.api.dto.TiendaPublicaResponse;
import com.regalia.backend.tienda.application.TiendaConsultaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST público para consultar tiendas visibles
 * dentro del marketplace de REGALIA.
 *
 * No gestiona tiendas del vendedor.
 * La gestión privada vive en VendedorTiendaController.
 */
@RestController
@RequestMapping("/api/tiendas")
@RequiredArgsConstructor
public class TiendaController {

    private final TiendaConsultaService tiendaConsultaService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TiendaPublicaResponse>>> listarTiendasPublicas() {
        List<TiendaPublicaResponse> tiendas = tiendaConsultaService.listarTiendasPublicas();

        return ResponseEntity.ok(
                ApiResponse.success(tiendas)
        );
    }

    @GetMapping("/{idTienda}")
    public ResponseEntity<ApiResponse<TiendaPublicaDetalleResponse>> obtenerTiendaPublicaPorId(
            @PathVariable Long idTienda
    ) {
        TiendaPublicaDetalleResponse tienda = tiendaConsultaService.obtenerTiendaPublicaPorId(idTienda);

        return ResponseEntity.ok(
                ApiResponse.success(tienda)
        );
    }
}