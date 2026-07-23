package com.regalia.backend.media.application;

import java.util.Objects;

/** Datos necesarios para solicitar una carga temporal al almacenamiento. */
public record MediaUploadCommand(
        String claveObjeto,
        String tipoContenido,
        long tamanioBytes
) {
    public MediaUploadCommand {
        Objects.requireNonNull(claveObjeto, "La clave del objeto es obligatoria");
        Objects.requireNonNull(tipoContenido, "El tipo de contenido es obligatorio");

        if (claveObjeto.isBlank() || tipoContenido.isBlank() || tamanioBytes < 1) {
            throw new IllegalArgumentException("La solicitud de carga de medios no es valida");
        }
    }
}
