package com.regalia.backend.rubro.api;

import com.regalia.backend.rubro.api.dto.RubroResponse;
import com.regalia.backend.rubro.application.RubroService;
import com.regalia.backend.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST publico para consultar rubros comerciales activos.
 */
@RestController
@RequestMapping("/api/rubros")
@RequiredArgsConstructor
public class RubroController {

    private final RubroService rubroService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RubroResponse>>> listarRubrosActivos() {
        List<RubroResponse> rubros = rubroService.listarRubrosActivos();

        return ResponseEntity.ok(
                ApiResponse.success(rubros)
        );
    }

    @GetMapping("/{idRubro}")
    public ResponseEntity<ApiResponse<RubroResponse>> obtenerRubroPorId(
            @PathVariable Long idRubro
    ) {
        RubroResponse rubro = rubroService.obtenerRubroActivoPorId(idRubro);

        return ResponseEntity.ok(
                ApiResponse.success(rubro)
        );
    }
}
