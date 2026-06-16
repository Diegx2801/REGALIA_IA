package com.regalia.backend.rubro.api;

import com.regalia.backend.rubro.api.dto.RubroRequest;
import com.regalia.backend.rubro.api.dto.RubroResponse;
import com.regalia.backend.rubro.application.RubroService;
import com.regalia.backend.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para consultar y administrar rubros comerciales de tiendas.
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

    @PostMapping
    public ResponseEntity<ApiResponse<RubroResponse>> crearRubro(
            @Valid @RequestBody RubroRequest request
    ) {
        RubroResponse rubroCreado = rubroService.crearRubro(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(rubroCreado, "Rubro creado correctamente"));
    }

    @PutMapping("/{idRubro}")
    public ResponseEntity<ApiResponse<RubroResponse>> actualizarRubro(
            @PathVariable Long idRubro,
            @Valid @RequestBody RubroRequest request
    ) {
        RubroResponse rubroActualizado = rubroService.actualizarRubro(idRubro, request);

        return ResponseEntity.ok(
                ApiResponse.success(rubroActualizado, "Rubro actualizado correctamente")
        );
    }

    @DeleteMapping("/{idRubro}")
    public ResponseEntity<ApiResponse<Void>> desactivarRubro(
            @PathVariable Long idRubro
    ) {
        rubroService.desactivarRubro(idRubro);

        return ResponseEntity.ok(
                ApiResponse.success(null, "Rubro desactivado correctamente")
        );
    }

    @PatchMapping("/{idRubro}/reactivar")
    public ResponseEntity<ApiResponse<RubroResponse>> reactivarRubro(
            @PathVariable Long idRubro
    ) {
        RubroResponse rubroReactivado = rubroService.reactivarRubro(idRubro);

        return ResponseEntity.ok(
                ApiResponse.success(rubroReactivado, "Rubro reactivado correctamente")
        );
    }
}