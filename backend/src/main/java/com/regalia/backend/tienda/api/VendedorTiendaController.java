package com.regalia.backend.tienda.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.tienda.api.dto.TiendaRequest;
import com.regalia.backend.tienda.api.dto.TiendaResponse;
import com.regalia.backend.tienda.application.TiendaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para la gestión privada de tiendas
 * del vendedor autenticado.
 *
 * Estas rutas pertenecen al panel privado del vendedor.
 */
@RestController
@RequestMapping("/api/vendedores/me/tiendas")
@RequiredArgsConstructor
public class VendedorTiendaController {

    private final TiendaService tiendaService;

    @PostMapping
    public ResponseEntity<ApiResponse<TiendaResponse>> crearTienda(
            Authentication authentication,
            @Valid @RequestBody TiendaRequest request
    ) {
        TiendaResponse tiendaCreada = tiendaService.crearTienda(
                authentication.getName(),
                request
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(tiendaCreada, "Tienda creada correctamente"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TiendaResponse>>> listarMisTiendas(
            Authentication authentication
    ) {
        List<TiendaResponse> tiendas = tiendaService.listarMisTiendas(
                authentication.getName()
        );

        return ResponseEntity.ok(
                ApiResponse.success(tiendas)
        );
    }

    @GetMapping("/{idTienda}")
    public ResponseEntity<ApiResponse<TiendaResponse>> obtenerMiTiendaPorId(
            Authentication authentication,
            @PathVariable Long idTienda
    ) {
        TiendaResponse tienda = tiendaService.obtenerMiTiendaPorId(
                authentication.getName(),
                idTienda
        );

        return ResponseEntity.ok(
                ApiResponse.success(tienda)
        );
    }

    @PutMapping("/{idTienda}")
    public ResponseEntity<ApiResponse<TiendaResponse>> actualizarTienda(
            Authentication authentication,
            @PathVariable Long idTienda,
            @Valid @RequestBody TiendaRequest request
    ) {
        TiendaResponse tiendaActualizada = tiendaService.actualizarTienda(
                authentication.getName(),
                idTienda,
                request
        );

        return ResponseEntity.ok(
                ApiResponse.success(tiendaActualizada, "Tienda actualizada correctamente")
        );
    }

    @DeleteMapping("/{idTienda}")
    public ResponseEntity<ApiResponse<Void>> eliminarTienda(
            Authentication authentication,
            @PathVariable Long idTienda
    ) {
        tiendaService.eliminarTienda(authentication.getName(), idTienda);

        return ResponseEntity.ok(
                ApiResponse.success(null, "Tienda eliminada correctamente")
        );
    }
}