package com.regalia.backend.tipopago.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.tipopago.api.dto.TipoPagoResponse;
import com.regalia.backend.tipopago.application.TipoPagoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Controlador de consulta administrativa para medios de pago gestionados por la plataforma. */
@RestController
@RequestMapping("/api/admin/tipos-pago")
@RequiredArgsConstructor
public class AdminTipoPagoController {

    private final TipoPagoService tipoPagoService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TipoPagoResponse>>> listarTiposPagoAdministracion() {
        return ResponseEntity.ok(ApiResponse.success(tipoPagoService.listarTiposPagoAdministracion()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TipoPagoResponse>> buscarTipoPagoAdministracionPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(tipoPagoService.buscarTipoPagoAdministracionPorId(id)));
    }
}
