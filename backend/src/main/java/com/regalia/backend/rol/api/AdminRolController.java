package com.regalia.backend.rol.api;

import com.regalia.backend.rol.api.dto.RolResponse;
import com.regalia.backend.rol.application.RolService;
import com.regalia.backend.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST administrativo para consultar roles del sistema.
 */
@RestController
@RequestMapping("/api/admin/roles")
@RequiredArgsConstructor
public class AdminRolController {

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
