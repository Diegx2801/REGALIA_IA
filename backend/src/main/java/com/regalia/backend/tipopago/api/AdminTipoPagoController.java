package com.regalia.backend.tipopago.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.tipopago.api.dto.TipoPagoRequest;
import com.regalia.backend.tipopago.api.dto.TipoPagoResponse;
import com.regalia.backend.tipopago.application.TipoPagoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST administrativo para tipos de pago.
 *
 * El administrador puede consultar y actualizar datos visibles,
 * pero no crear codigos nuevos porque estos gobiernan lógica interna.
 */
@RestController
@RequestMapping("/api/admin/tipos-pago")
@RequiredArgsConstructor
public class AdminTipoPagoController {

    private final TipoPagoService tipoPagoService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TipoPagoResponse>>> listarTiposPagoAdministracion() {
        List<TipoPagoResponse> tiposPago = tipoPagoService.listarTiposPagoAdministracion();

        return ResponseEntity.ok(
                ApiResponse.success(tiposPago)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TipoPagoResponse>> buscarTipoPagoAdministracionPorId(@PathVariable Long id) {
        TipoPagoResponse tipoPago = tipoPagoService.buscarTipoPagoAdministracionPorId(id);

        return ResponseEntity.ok(
                ApiResponse.success(tipoPago)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TipoPagoResponse>> actualizarDatosVisibles(
            @PathVariable Long id,
            @Valid @RequestBody TipoPagoRequest request
    ) {
        TipoPagoResponse tipoPagoActualizado = tipoPagoService.actualizarDatosVisibles(id, request);

        return ResponseEntity.ok(
                ApiResponse.success(tipoPagoActualizado, "Tipo de pago actualizado correctamente")
        );
    }
}
