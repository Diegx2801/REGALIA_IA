package com.regalia.backend.producto.api;

import com.regalia.backend.producto.api.dto.ProductoRequest;
import com.regalia.backend.producto.api.dto.ProductoResponse;
import com.regalia.backend.producto.application.ProductoService;
import com.regalia.backend.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador REST para gestionar productos específicos
 * del vendedor autenticado.
 */
@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;

    @GetMapping("/{idProducto}")
    public ResponseEntity<ApiResponse<ProductoResponse>> obtenerProductoPorId(
            Authentication authentication,
            @PathVariable Long idProducto
    ) {
        ProductoResponse producto = productoService.obtenerProductoPropioPorId(
                authentication.getName(),
                idProducto
        );

        return ResponseEntity.ok(
                ApiResponse.success(producto)
        );
    }

    @PutMapping("/{idProducto}")
    public ResponseEntity<ApiResponse<ProductoResponse>> actualizarProducto(
            Authentication authentication,
            @PathVariable Long idProducto,
            @Valid @RequestBody ProductoRequest request
    ) {
        ProductoResponse productoActualizado = productoService.actualizarProducto(
                authentication.getName(),
                idProducto,
                request
        );

        return ResponseEntity.ok(
                ApiResponse.success(productoActualizado, "Producto actualizado correctamente")
        );
    }

    @DeleteMapping("/{idProducto}")
    public ResponseEntity<ApiResponse<Void>> desactivarProducto(
            Authentication authentication,
            @PathVariable Long idProducto
    ) {
        productoService.desactivarProducto(authentication.getName(), idProducto);

        return ResponseEntity.ok(
                ApiResponse.success(null, "Producto desactivado correctamente")
        );
    }
}