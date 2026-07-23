package com.regalia.backend.productoimagen.api.dto;

import java.time.Instant;
import java.util.Map;

/** Datos mínimos para que el navegador cargue un archivo directamente a R2. */
public record CargaImagenProductoResponse(
        String claveTemporal,
        String urlCarga,
        Map<String, String> cabecerasRequeridas,
        Instant expiraEn
) {
}
