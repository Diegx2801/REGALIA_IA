package com.regalia.backend.media.application;

import java.time.Instant;
import java.util.Map;

/** URL y condiciones temporales que el cliente debe respetar al subir un medio. */
public record MediaUploadTicket(
        String urlCarga,
        Map<String, String> cabecerasRequeridas,
        Instant expiraEn
) {
    public MediaUploadTicket {
        cabecerasRequeridas = Map.copyOf(cabecerasRequeridas);
    }
}
