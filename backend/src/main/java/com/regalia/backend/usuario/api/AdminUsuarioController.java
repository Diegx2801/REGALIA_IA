package com.regalia.backend.usuario.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.usuario.api.dto.UsuarioResponse;
import com.regalia.backend.usuario.application.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST administrativo para gestionar usuarios.
 */
@RestController
@RequestMapping("/api/admin/usuarios")
@RequiredArgsConstructor
public class AdminUsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UsuarioResponse>>> listarUsuariosGestionablesAdministracion() {
        List<UsuarioResponse> usuarios = usuarioService.listarUsuariosGestionablesAdministracion();

        return ResponseEntity.ok(
                ApiResponse.success(usuarios)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UsuarioResponse>> buscarUsuarioGestionableAdministracionPorId(
            @PathVariable Long id
    ) {
        UsuarioResponse usuario = usuarioService.buscarUsuarioGestionableAdministracionPorId(id);

        return ResponseEntity.ok(
                ApiResponse.success(usuario)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> desactivar(@PathVariable Long id) {
        usuarioService.desactivarUsuarioGestionableAdministracion(id);

        return ResponseEntity.ok(
                ApiResponse.success(null, "Usuario desactivado correctamente")
        );
    }
}
