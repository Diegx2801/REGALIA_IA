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

    void copiarObjeto(String claveOrigen, String claveDestino);

    void eliminarObjeto(String claveObjeto);

    String construirUrlPublica(String claveObjeto);
}
