package com.regalia.backend.tipopago.api;

import com.regalia.backend.tipopago.api.dto.TipoPagoRequest;
import com.regalia.backend.tipopago.api.dto.TipoPagoResponse;
import com.regalia.backend.tipopago.application.TipoPagoService;
import com.regalia.backend.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para exponer operaciones de tipos de pago.
 */
@RestController
@RequestMapping("/api/tipos-pago")
@RequiredArgsConstructor
public class TipoPagoController {

    private final TipoPagoService tipoPagoService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TipoPagoResponse>>> listarActivos() {
        List<TipoPagoResponse> tiposPago = tipoPagoService.listarActivos();

        return ResponseEntity.ok(
                ApiResponse.success(tiposPago)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TipoPagoResponse>> buscarPorId(@PathVariable Long id) {
        TipoPagoResponse tipoPago = tipoPagoService.buscarPorId(id);

        return ResponseEntity.ok(
                ApiResponse.success(tipoPago)
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TipoPagoResponse>> crear(@Valid @RequestBody TipoPagoRequest request) {
        TipoPagoResponse tipoPagoCreado = tipoPagoService.crear(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(tipoPagoCreado, "Tipo de pago creado correctamente"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TipoPagoResponse>> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody TipoPagoRequest request
    ) {
        TipoPagoResponse tipoPagoActualizado = tipoPagoService.actualizar(id, request);

        return ResponseEntity.ok(
                ApiResponse.success(tipoPagoActualizado, "Tipo de pago actualizado correctamente")
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> desactivar(@PathVariable Long id) {
        tipoPagoService.desactivar(id);

        return ResponseEntity.ok(
                ApiResponse.success(null, "Tipo de pago desactivado correctamente")
        );
    }

    @PatchMapping("/{id}/reactivar")
    public ResponseEntity<ApiResponse<TipoPagoResponse>> reactivar(@PathVariable Long id) {
        TipoPagoResponse tipoPagoReactivado = tipoPagoService.reactivar(id);

        return ResponseEntity.ok(
                ApiResponse.success(tipoPagoReactivado, "Tipo de pago reactivado correctamente")
        );
    }
}