package com.regalia.backend.tienda.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.tienda.api.dto.TiendaResponse;
import com.regalia.backend.tienda.application.TiendaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST administrativo para revisar y moderar tiendas.
 */
@RestController
@RequestMapping("/api/admin/tiendas")
@RequiredArgsConstructor
public class AdminTiendaController {

    private final TiendaService tiendaService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TiendaResponse>>> listarTiendasAdministracion(
            @RequestParam(required = false) String estadoRevision,
            @RequestParam(required = false) String searchField,
            @RequestParam(required = false) String search
    ) {
        List<TiendaResponse> tiendas = tiendaService.listarTiendasAdministracion(
                estadoRevision,
                searchField,
                search
        );

        return ResponseEntity.ok(
                ApiResponse.success(tiendas)
        );
    }

    @GetMapping("/{idTienda}")
    public ResponseEntity<ApiResponse<TiendaResponse>> obtenerTiendaAdministracionPorId(
            @PathVariable Long idTienda
    ) {
        TiendaResponse tienda = tiendaService.obtenerTiendaAdministracionPorId(idTienda);

        return ResponseEntity.ok(
                ApiResponse.success(tienda)
        );
    }

    @PatchMapping("/{idTienda}/pendiente")
    public ResponseEntity<ApiResponse<TiendaResponse>> marcarTiendaPendiente(
            @PathVariable Long idTienda
    ) {
        TiendaResponse tienda = tiendaService.marcarTiendaPendiente(idTienda);

        return ResponseEntity.ok(
                ApiResponse.success(tienda, "Tienda marcada como pendiente correctamente")
        );
    }

    @PatchMapping("/{idTienda}/aprobar")
    public ResponseEntity<ApiResponse<TiendaResponse>> aprobarTienda(
            @PathVariable Long idTienda
    ) {
        TiendaResponse tienda = tiendaService.aprobarTienda(idTienda);

        return ResponseEntity.ok(
                ApiResponse.success(tienda, "Tienda aprobada correctamente")
        );
    }

    @PatchMapping("/{idTienda}/observar")
    public ResponseEntity<ApiResponse<TiendaResponse>> observarTienda(
            @PathVariable Long idTienda
    ) {
        TiendaResponse tienda = tiendaService.observarTienda(idTienda);

        return ResponseEntity.ok(
                ApiResponse.success(tienda, "Tienda observada correctamente")
        );
    }

    @PatchMapping("/{idTienda}/rechazar")
    public ResponseEntity<ApiResponse<TiendaResponse>> rechazarTienda(
            @PathVariable Long idTienda
    ) {
        TiendaResponse tienda = tiendaService.rechazarTienda(idTienda);

        return ResponseEntity.ok(
                ApiResponse.success(tienda, "Tienda rechazada correctamente")
        );
    }
}
