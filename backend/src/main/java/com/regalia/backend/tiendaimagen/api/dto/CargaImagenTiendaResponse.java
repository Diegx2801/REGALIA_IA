package com.regalia.backend.tiendaimagen.api.dto;

import java.time.Instant;
import java.util.Map;

/** Datos necesarios para una carga directa y temporal al almacenamiento de medios. */
public record CargaImagenTiendaResponse(
        String tipoImagen,
        String claveTemporal,
        String urlCarga,
        Map<String, String> cabecerasRequeridas,
        Instant expiraEn
) {
}
