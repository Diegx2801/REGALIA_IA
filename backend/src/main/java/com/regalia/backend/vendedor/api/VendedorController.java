package com.regalia.backend.vendedor.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.vendedor.api.dto.VendedorResponse;
import com.regalia.backend.vendedor.application.VendedorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador REST para gestionar el perfil vendedor del usuario autenticado.
 */
@RestController
@RequestMapping("/api/vendedores/me")
@RequiredArgsConstructor
public class VendedorController {

    private final VendedorService vendedorService;

    @PostMapping
    public ResponseEntity<ApiResponse<VendedorResponse>> crearMiPerfilVendedor(Authentication authentication) {
        VendedorResponse vendedorCreado = vendedorService.crearMiPerfilVendedor(authentication.getName());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(vendedorCreado, "Perfil vendedor creado correctamente"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<VendedorResponse>> obtenerMiPerfilVendedor(Authentication authentication) {
        VendedorResponse vendedor = vendedorService.obtenerMiPerfilVendedor(authentication.getName());

        return ResponseEntity.ok(
                ApiResponse.success(vendedor)
        );
    }
}