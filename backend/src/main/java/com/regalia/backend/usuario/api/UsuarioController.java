package com.regalia.backend.usuario.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.usuario.api.dto.UsuarioActualizarRequest;
import com.regalia.backend.usuario.api.dto.UsuarioRequest;
import com.regalia.backend.usuario.api.dto.UsuarioResponse;
import com.regalia.backend.usuario.application.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para exponer operaciones de usuarios.
 */
@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UsuarioResponse>> obtenerMiPerfil(Authentication authentication) {
        UsuarioResponse usuario = usuarioService.buscarPerfilAutenticado(authentication.getName());

        return ResponseEntity.ok(
                ApiResponse.success(usuario)
        );
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UsuarioResponse>> actualizarMiPerfil(
            Authentication authentication,
            @Valid @RequestBody UsuarioActualizarRequest request
    ) {
        UsuarioResponse usuarioActualizado = usuarioService.actualizarPerfilAutenticado(
                authentication.getName(),
                request
        );

        return ResponseEntity.ok(
                ApiResponse.success(usuarioActualizado, "Perfil actualizado correctamente")
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UsuarioResponse>>> listarActivos() {
        List<UsuarioResponse> usuarios = usuarioService.listarActivos();

        return ResponseEntity.ok(
                ApiResponse.success(usuarios)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UsuarioResponse>> buscarPorId(@PathVariable Long id) {
        UsuarioResponse usuario = usuarioService.buscarPorId(id);

        return ResponseEntity.ok(
                ApiResponse.success(usuario)
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UsuarioResponse>> crear(@Valid @RequestBody UsuarioRequest request) {
        UsuarioResponse usuarioCreado = usuarioService.crear(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(usuarioCreado, "Usuario creado correctamente"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UsuarioResponse>> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioActualizarRequest request
    ) {
        UsuarioResponse usuarioActualizado = usuarioService.actualizar(id, request);

        return ResponseEntity.ok(
                ApiResponse.success(usuarioActualizado, "Usuario actualizado correctamente")
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> desactivar(@PathVariable Long id) {
        usuarioService.desactivar(id);

        return ResponseEntity.ok(
                ApiResponse.success(null, "Usuario desactivado correctamente")
        );
    }
}