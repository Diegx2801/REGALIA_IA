package com.regalia.backend.usuario.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.shared.response.PaginaResponse;
import com.regalia.backend.usuario.api.dto.UsuarioResponse;
import com.regalia.backend.usuario.application.UsuarioEstadoFiltro;
import com.regalia.backend.usuario.application.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador REST administrativo para gestionar usuarios.
 */
@RestController
@RequestMapping("/api/admin/usuarios")
@RequiredArgsConstructor
public class AdminUsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<ApiResponse<PaginaResponse<UsuarioResponse>>> listarUsuariosGestionablesAdministracion(
            @RequestParam(defaultValue = "ACTIVO") String estado,
            @RequestParam(required = false) String searchField,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "idUsuario,asc") String sort
    ) {
        UsuarioEstadoFiltro filtro = UsuarioEstadoFiltro.desde(estado);
        PaginaResponse<UsuarioResponse> usuarios = usuarioService.listarUsuariosGestionablesAdministracion(
                filtro,
                searchField,
                search,
                page,
                size,
                sort
        );

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

    @PatchMapping("/{id}/desactivar")
    public ResponseEntity<ApiResponse<UsuarioResponse>> desactivar(@PathVariable Long id) {
        UsuarioResponse usuario = usuarioService.desactivarUsuarioGestionableAdministracion(id);

        return ResponseEntity.ok(
                ApiResponse.success(usuario, "Usuario desactivado correctamente")
        );
    }

    @PatchMapping("/{id}/reactivar")
    public ResponseEntity<ApiResponse<UsuarioResponse>> reactivar(@PathVariable Long id) {
        UsuarioResponse usuario = usuarioService.reactivarUsuarioGestionableAdministracion(id);

        return ResponseEntity.ok(
                ApiResponse.success(usuario, "Usuario reactivado correctamente")
        );
    }
}
