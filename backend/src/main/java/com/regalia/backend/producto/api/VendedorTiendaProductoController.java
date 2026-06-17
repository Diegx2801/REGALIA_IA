package com.regalia.backend.producto.api;

import com.regalia.backend.producto.api.dto.ProductoRequest;
import com.regalia.backend.producto.api.dto.ProductoResponse;
import com.regalia.backend.producto.application.ProductoService;
import com.regalia.backend.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para la gestión privada de productos
 * dentro de una tienda del vendedor autenticado.
 *
 * Estas rutas pertenecen al panel privado del vendedor.
 */
@RestController
@RequestMapping("/api/vendedores/me/tiendas/{idTienda}/productos")
@RequiredArgsConstructor
public class VendedorTiendaProductoController {

    private final ProductoService productoService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductoResponse>> crearProducto(
            Authentication authentication,
            @PathVariable Long idTienda,
            @Valid @RequestBody ProductoRequest request
    ) {
        ProductoResponse productoCreado = productoService.crearProducto(
                authentication.getName(),
                idTienda,
                request
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(productoCreado, "Producto creado correctamente"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductoResponse>>> listarProductosDeMiTienda(
            Authentication authentication,
            @PathVariable Long idTienda
    ) {
        List<ProductoResponse> productos = productoService.listarProductosDeMiTienda(
                authentication.getName(),
                idTienda
        );

        return ResponseEntity.ok(
                ApiResponse.success(productos)
        );
    }

    @GetMapping("/{idProducto}")
    public ResponseEntity<ApiResponse<ProductoResponse>> obtenerProductoDeMiTienda(
            Authentication authentication,
            @PathVariable Long idTienda,
            @PathVariable Long idProducto
    ) {
        ProductoResponse producto = productoService.obtenerProductoPropioPorId(
                authentication.getName(),
                idTienda,
                idProducto
        );

        return ResponseEntity.ok(
                ApiResponse.success(producto)
        );
    }

    @PutMapping("/{idProducto}")
    public ResponseEntity<ApiResponse<ProductoResponse>> actualizarProductoDeMiTienda(
            Authentication authentication,
            @PathVariable Long idTienda,
            @PathVariable Long idProducto,
            @Valid @RequestBody ProductoRequest request
    ) {
        ProductoResponse productoActualizado = productoService.actualizarProducto(
                authentication.getName(),
                idTienda,
                idProducto,
                request
        );

        return ResponseEntity.ok(
                ApiResponse.success(productoActualizado, "Producto actualizado correctamente")
        );
    }

    @DeleteMapping("/{idProducto}")
    public ResponseEntity<ApiResponse<Void>> desactivarProductoDeMiTienda(
            Authentication authentication,
            @PathVariable Long idTienda,
            @PathVariable Long idProducto
    ) {
        productoService.desactivarProducto(
                authentication.getName(),
                idTienda,
                idProducto
        );

        return ResponseEntity.ok(
                ApiResponse.success(null, "Producto desactivado correctamente")
        );
    }
}