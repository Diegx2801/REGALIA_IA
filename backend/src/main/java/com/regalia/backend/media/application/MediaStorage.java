package com.regalia.backend.media.application;

/**
 * Puerto de almacenamiento de medios.
 *
 * El dominio comercial depende de este contrato y no del SDK de Cloudflare,
 * lo que permite sustituir R2 por otro proveedor compatible en el futuro.
 */
public interface MediaStorage {

    MediaUploadTicket generarCargaFirmada(MediaUploadCommand command);

    MediaObjectMetadata obtenerMetadata(String claveObjeto);

    /** Lee la cabecera del objeto para comprobar su firma binaria. */
    byte[] leerCabecera(String claveObjeto, int cantidadMaximaBytes);

    /**
     * Lee un objeto de tamaño acotado para validar su contenido antes de hacerlo público.
     * No debe usarse para entregar medios al cliente.
     */
    byte[] leerObjeto(String claveObjeto, long tamanioMaximoBytes);

    /**
     * Promueve un objeto temporal a su ubicación pública final.
     *
     * La implementación debe preservar el tipo de contenido y aplicar la política de caché
     * apropiada para un recurso final cuya clave no volverá a reutilizarse.
     */
    void promoverObjeto(String claveOrigen, String claveDestino, String tipoContenido);

    void eliminarObjeto(String claveObjeto);

    String construirUrlPublica(String claveObjeto);
}
