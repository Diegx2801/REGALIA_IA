package com.regalia.backend.rol.api;

import com.regalia.backend.rol.api.dto.RolResponse;
import com.regalia.backend.rol.application.RolService;
import com.regalia.backend.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para exponer operaciones de consulta de roles.
 */
@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RolController {

    private final RolService rolService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RolResponse>>> listarActivos() {
        List<RolResponse> roles = rolService.listarActivos();

        return ResponseEntity.ok(
                ApiResponse.success(roles)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RolResponse>> buscarPorId(@PathVariable Long id) {
        RolResponse rol = rolService.buscarPorId(id);

        return ResponseEntity.ok(
                ApiResponse.success(rol)
        );
    }
}