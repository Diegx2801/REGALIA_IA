package com.regalia.backend.producto.api;

import com.regalia.backend.producto.api.dto.ProductoPublicoResponse;
import com.regalia.backend.producto.application.ProductoConsultaService;
import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.shared.response.PaginaResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

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

    @GetMapping
    public ResponseEntity<ApiResponse<PaginaResponse<ProductoPublicoResponse>>> listarProductosPublicos(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long idTipoProducto,
            @RequestParam(required = false) BigDecimal precioMaximo,
            @RequestParam(defaultValue = "true") Boolean soloDisponibles,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "12") Integer size,
            @RequestParam(defaultValue = "recomendado,asc") String sort
    ) {
        PaginaResponse<ProductoPublicoResponse> productos = productoConsultaService
                .listarProductosPublicos(
                        search,
                        idTipoProducto,
                        precioMaximo,
                        soloDisponibles,
                        page,
                        size,
                        sort
                );

        return ResponseEntity.ok(
                ApiResponse.success(productos)
        );
    }

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
