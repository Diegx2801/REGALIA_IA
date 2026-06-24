package com.regalia.backend.tipoproducto.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.tipoproducto.api.dto.TipoProductoRequest;
import com.regalia.backend.tipoproducto.api.dto.TipoProductoResponse;
import com.regalia.backend.tipoproducto.application.TipoProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST administrativo para gestionar tipos de producto.
 */
@RestController
@RequestMapping("/api/admin/tipos-producto")
@RequiredArgsConstructor
public class AdminTipoProductoController {

    private final TipoProductoService tipoProductoService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TipoProductoResponse>>> listarTiposProductoAdministracion() {
        List<TipoProductoResponse> tiposProducto = tipoProductoService.listarTiposProductoAdministracion();

        return ResponseEntity.ok(
                ApiResponse.success(tiposProducto)
        );
    }

    @GetMapping("/{idTipoProducto}")
    public ResponseEntity<ApiResponse<TipoProductoResponse>> obtenerTipoProductoAdministracionPorId(
            @PathVariable Long idTipoProducto
    ) {
        TipoProductoResponse tipoProducto = tipoProductoService.obtenerTipoProductoAdministracionPorId(idTipoProducto);

        return ResponseEntity.ok(
                ApiResponse.success(tipoProducto)
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TipoProductoResponse>> crearTipoProducto(
            @Valid @RequestBody TipoProductoRequest request
    ) {
        TipoProductoResponse tipoProductoCreado = tipoProductoService.crearTipoProducto(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(tipoProductoCreado, "Tipo de producto creado correctamente"));
    }

    @PutMapping("/{idTipoProducto}")
    public ResponseEntity<ApiResponse<TipoProductoResponse>> actualizarTipoProducto(
            @PathVariable Long idTipoProducto,
            @Valid @RequestBody TipoProductoRequest request
    ) {
        TipoProductoResponse tipoProductoActualizado = tipoProductoService.actualizarTipoProducto(
                idTipoProducto,
                request
        );

        return ResponseEntity.ok(
                ApiResponse.success(tipoProductoActualizado, "Tipo de producto actualizado correctamente")
        );
    }

    @DeleteMapping("/{idTipoProducto}")
    public ResponseEntity<ApiResponse<Void>> desactivarTipoProducto(
            @PathVariable Long idTipoProducto
    ) {
        tipoProductoService.desactivarTipoProducto(idTipoProducto);

        return ResponseEntity.ok(
                ApiResponse.success(null, "Tipo de producto desactivado correctamente")
        );
    }

    @PatchMapping("/{idTipoProducto}/reactivar")
    public ResponseEntity<ApiResponse<TipoProductoResponse>> reactivarTipoProducto(
            @PathVariable Long idTipoProducto
    ) {
        TipoProductoResponse tipoProductoReactivado = tipoProductoService.reactivarTipoProducto(idTipoProducto);

        return ResponseEntity.ok(
                ApiResponse.success(tipoProductoReactivado, "Tipo de producto reactivado correctamente")
        );
    }
}
