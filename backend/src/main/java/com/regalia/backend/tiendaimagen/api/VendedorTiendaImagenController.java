package com.regalia.backend.tiendaimagen.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.tiendaimagen.api.dto.CargaImagenTiendaResponse;
import com.regalia.backend.tiendaimagen.api.dto.ConfirmarCargaImagenTiendaRequest;
import com.regalia.backend.tiendaimagen.api.dto.SolicitudCargaImagenTiendaRequest;
import com.regalia.backend.tiendaimagen.api.dto.TiendaImagenResponse;
import com.regalia.backend.tiendaimagen.application.TiendaImagenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Rutas privadas para logo y portada de la tienda autenticada. */
@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "regalia.media", name = "provider", havingValue = "R2")
@RequestMapping("/api/vendedores/me/tiendas/{idTienda}/imagenes")
public class VendedorTiendaImagenController {

    private final TiendaImagenService tiendaImagenService;

    @PostMapping("/cargas")
    public ResponseEntity<ApiResponse<CargaImagenTiendaResponse>> solicitarCarga(
            Authentication authentication,
            @PathVariable Long idTienda,
            @Valid @RequestBody SolicitudCargaImagenTiendaRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                tiendaImagenService.solicitarCarga(authentication.getName(), idTienda, request)
        ));
    }

    @PostMapping("/{tipoImagen}/confirmar")
    public ResponseEntity<ApiResponse<TiendaImagenResponse>> confirmarCarga(
            Authentication authentication,
            @PathVariable Long idTienda,
            @PathVariable String tipoImagen,
            @Valid @RequestBody ConfirmarCargaImagenTiendaRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                tiendaImagenService.confirmarCarga(
                        authentication.getName(), idTienda, tipoImagen, request.claveTemporal()
                ),
                "Imagen de tienda actualizada correctamente"
        ));
    }
}
