package com.regalia.backend.productoimagen.api;

import com.regalia.backend.producto.api.dto.ProductoResponse;
import com.regalia.backend.productoimagen.api.dto.CargaImagenProductoResponse;
import com.regalia.backend.productoimagen.api.dto.ConfirmarCargaImagenProductoRequest;
import com.regalia.backend.productoimagen.api.dto.OrdenImagenesProductoRequest;
import com.regalia.backend.productoimagen.api.dto.SolicitudCargaImagenProductoRequest;
import com.regalia.backend.productoimagen.application.ProductoImagenService;
import com.regalia.backend.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Rutas privadas para el ciclo de carga y gestión de imágenes de producto. */
@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "regalia.media", name = "provider", havingValue = "R2")
@RequestMapping("/api/vendedores/me/tiendas/{idTienda}/productos/{idProducto}/imagenes")
public class VendedorProductoImagenController {

    private final ProductoImagenService productoImagenService;

    @PostMapping("/cargas")
    public ResponseEntity<ApiResponse<CargaImagenProductoResponse>> solicitarCarga(
            Authentication authentication,
            @PathVariable Long idTienda,
            @PathVariable Long idProducto,
            @Valid @RequestBody SolicitudCargaImagenProductoRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                productoImagenService.solicitarCarga(authentication.getName(), idTienda, idProducto, request)
        ));
    }

    @PostMapping("/confirmar")
    public ResponseEntity<ApiResponse<ProductoResponse.ImagenResumen>> confirmarCarga(
            Authentication authentication,
            @PathVariable Long idTienda,
            @PathVariable Long idProducto,
            @Valid @RequestBody ConfirmarCargaImagenProductoRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                productoImagenService.confirmarCarga(
                        authentication.getName(), idTienda, idProducto, request.claveTemporal()
                ),
                "Imagen agregada correctamente"
        ));
    }

    @DeleteMapping("/{idProductoImagen}")
    public ResponseEntity<ApiResponse<Void>> eliminarImagen(
            Authentication authentication,
            @PathVariable Long idTienda,
            @PathVariable Long idProducto,
            @PathVariable Long idProductoImagen
    ) {
        productoImagenService.eliminarImagen(authentication.getName(), idTienda, idProducto, idProductoImagen);
        return ResponseEntity.ok(ApiResponse.success(null, "Imagen eliminada correctamente"));
    }

    @PutMapping("/orden")
    public ResponseEntity<ApiResponse<List<ProductoResponse.ImagenResumen>>> ordenarImagenes(
            Authentication authentication,
            @PathVariable Long idTienda,
            @PathVariable Long idProducto,
            @Valid @RequestBody OrdenImagenesProductoRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(productoImagenService.ordenarImagenes(
                authentication.getName(), idTienda, idProducto, request.idsProductoImagen()
        )));
    }
}
