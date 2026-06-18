package com.regalia.backend.producto.api;

import com.regalia.backend.producto.api.dto.ProductoPublicoResponse;
import com.regalia.backend.producto.application.ProductoConsultaService;
import com.regalia.backend.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador REST público para consultar productos visibles
 * dentro del marketplace de REGALIA.
 *
 * No gestiona productos del vendedor.
 * La gestión privada vive en VendedorTiendaProductoController.
 */
@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoConsultaService productoConsultaService;

    @GetMapping("/{idProducto}")
    public ResponseEntity<ApiResponse<ProductoPublicoResponse>> obtenerProductoPublicoPorId(
            @PathVariable Long idProducto
    ) {
        ProductoPublicoResponse producto = productoConsultaService.obtenerProductoPublicoPorId(idProducto);

        return ResponseEntity.ok(
                ApiResponse.success(producto)
        );
    }
}