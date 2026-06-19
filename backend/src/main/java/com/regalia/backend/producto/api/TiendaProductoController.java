package com.regalia.backend.producto.api;

import com.regalia.backend.producto.api.dto.ProductoPublicoResponse;
import com.regalia.backend.producto.application.ProductoConsultaService;
import com.regalia.backend.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST público para consultar productos visibles
 * de una tienda dentro del marketplace de REGALIA.
 *
 * No gestiona productos del vendedor.
 * La gestión privada vive en VendedorTiendaProductoController.
 */
@RestController
@RequestMapping("/api/tiendas/{idTienda}/productos")
@RequiredArgsConstructor
public class TiendaProductoController {

    private final ProductoConsultaService productoConsultaService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductoPublicoResponse>>> listarProductosPublicosDeTienda(
            @PathVariable Long idTienda
    ) {
        List<ProductoPublicoResponse> productos = productoConsultaService.listarProductosPublicosDeTienda(idTienda);

        return ResponseEntity.ok(
                ApiResponse.success(productos)
        );
    }
}