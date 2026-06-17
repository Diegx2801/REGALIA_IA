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
 * Controlador REST para gestionar productos asociados
 * a una tienda del vendedor autenticado.
 */
@RestController
@RequestMapping("/api/tiendas/{idTienda}/productos")
@RequiredArgsConstructor
public class TiendaProductoController {

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
}