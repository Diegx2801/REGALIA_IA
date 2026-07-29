package com.regalia.backend.rubro.api;

import com.regalia.backend.rubro.api.dto.RubroResponse;
import com.regalia.backend.rubro.application.RubroService;
import com.regalia.backend.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Controlador de consulta administrativa para rubros comerciales controlados. */
@RestController
@RequestMapping("/api/admin/rubros")
@RequiredArgsConstructor
public class AdminRubroController {

    private final RubroService rubroService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RubroResponse>>> listarRubrosAdministracion() {
        return ResponseEntity.ok(ApiResponse.success(rubroService.listarRubrosAdministracion()));
    }

    @GetMapping("/{idRubro}")
    public ResponseEntity<ApiResponse<RubroResponse>> obtenerRubroAdministracionPorId(@PathVariable Long idRubro) {
        return ResponseEntity.ok(ApiResponse.success(rubroService.obtenerRubroAdministracionPorId(idRubro)));
    }
}
