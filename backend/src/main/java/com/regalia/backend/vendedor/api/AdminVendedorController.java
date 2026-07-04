package com.regalia.backend.vendedor.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.shared.response.PaginaResponse;
import com.regalia.backend.vendedor.api.dto.AdminVendedorResponse;
import com.regalia.backend.vendedor.application.VendedorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador REST administrativo para consultar vendedores.
 */
@RestController
@RequestMapping("/api/admin/vendedores")
@RequiredArgsConstructor
public class AdminVendedorController {

    private final VendedorService vendedorService;

    @GetMapping
    public ResponseEntity<ApiResponse<PaginaResponse<AdminVendedorResponse>>> listarVendedores(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String verificacion,
            @RequestParam(required = false) String searchField,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sort
    ) {
        PaginaResponse<AdminVendedorResponse> vendedores = vendedorService.listarVendedoresAdmin(
                estado,
                verificacion,
                searchField,
                search,
                page,
                size,
                sort
        );

        return ResponseEntity.ok(
                ApiResponse.success(vendedores)
        );
    }

    @GetMapping("/{idVendedor}")
    public ResponseEntity<ApiResponse<AdminVendedorResponse>> obtenerVendedorPorId(
            @PathVariable Long idVendedor
    ) {
        AdminVendedorResponse vendedor = vendedorService.obtenerVendedorAdminPorId(idVendedor);

        return ResponseEntity.ok(
                ApiResponse.success(vendedor)
        );
    }
}
