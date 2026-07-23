package com.regalia.backend.media.application;

import java.time.Instant;

/** Metadatos verificables de un objeto ya almacenado. */
public record MediaObjectMetadata(
        String claveObjeto,
        String tipoContenido,
        long tamanioBytes,
        Instant fechaModificacion
) {
}
