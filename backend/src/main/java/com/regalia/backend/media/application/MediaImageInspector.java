package com.regalia.backend.media.application;

/** Puerto para inspeccionar dimensiones sin acoplar la aplicación a un proveedor de medios. */
public interface MediaImageInspector {

    MediaImageDimensions obtenerDimensiones(String tipoContenido, byte[] contenido);
}
