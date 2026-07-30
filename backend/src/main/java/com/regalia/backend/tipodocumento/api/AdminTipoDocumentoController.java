package com.regalia.backend.tipodocumento.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.tipodocumento.api.dto.TipoDocumentoResponse;
import com.regalia.backend.tipodocumento.application.TipoDocumentoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Controlador de consulta administrativa para tipos de documento controlados. */
@RestController
@RequestMapping("/api/admin/tipos-documento")
@RequiredArgsConstructor
public class AdminTipoDocumentoController {

    private final TipoDocumentoService tipoDocumentoService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TipoDocumentoResponse>>> listarTiposDocumentoAdministracion() {
        return ResponseEntity.ok(ApiResponse.success(tipoDocumentoService.listarTiposDocumentoAdministracion()));
    }

    @GetMapping("/{idTipoDocumento}")
    public ResponseEntity<ApiResponse<TipoDocumentoResponse>> obtenerTipoDocumentoAdministracionPorId(@PathVariable Long idTipoDocumento) {
        return ResponseEntity.ok(ApiResponse.success(tipoDocumentoService.buscarTipoDocumentoAdministracionPorId(idTipoDocumento)));
    }
}
