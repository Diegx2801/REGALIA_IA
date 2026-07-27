package com.regalia.backend.media.infrastructure.image;

import com.regalia.backend.media.application.MediaImageDimensions;
import com.regalia.backend.media.application.MediaImageInspector;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * Inspector liviano de cabeceras JPEG, PNG y WebP.
 *
 * Las dimensiones se obtienen del objeto real ya almacenado, nunca de valores
 * declarados por el navegador. Mantenerlo independiente evita que el dominio
 * dependa de una biblioteca de procesamiento o de un proveedor de almacenamiento.
 */
@Component
public class MediaImageBinaryInspector implements MediaImageInspector {

    @Override
    public MediaImageDimensions obtenerDimensiones(String tipoContenido, byte[] contenido) {
        if (contenido == null || contenido.length < 12) {
            throw imagenInvalida();
        }

        return switch (normalizarTipo(tipoContenido)) {
            case "image/png" -> dimensionesPng(contenido);
            case "image/jpeg" -> dimensionesJpeg(contenido);
            case "image/webp" -> dimensionesWebp(contenido);
            default -> throw imagenInvalida();
        };
    }

    private MediaImageDimensions dimensionesPng(byte[] datos) {
        if (datos.length < 24
                || !coincide(datos, 0, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
                || !coincideAscii(datos, 12, "IHDR")) {
            throw imagenInvalida();
        }

        return dimensiones(leerEnteroGrande(datos, 16), leerEnteroGrande(datos, 20));
    }

    private MediaImageDimensions dimensionesJpeg(byte[] datos) {
        if (!coincide(datos, 0, 0xFF, 0xD8)) {
            throw imagenInvalida();
        }

        int indice = 2;
        while (indice + 8 < datos.length) {
            while (indice < datos.length && sinSigno(datos[indice]) != 0xFF) {
                indice++;
            }
            while (indice < datos.length && sinSigno(datos[indice]) == 0xFF) {
                indice++;
            }
            if (indice >= datos.length) break;

            int marcador = sinSigno(datos[indice++]);
            if (marcador == 0xD8 || marcador == 0xD9 || (marcador >= 0xD0 && marcador <= 0xD7)) {
                continue;
            }
            if (indice + 1 >= datos.length) break;

            int longitudSegmento = leerEnteroCortoGrande(datos, indice);
            if (longitudSegmento < 2 || indice + longitudSegmento > datos.length) break;

            if (esMarcadorInicioFrame(marcador)) {
                if (longitudSegmento < 8) break;
                int alto = leerEnteroCortoGrande(datos, indice + 3);
                int ancho = leerEnteroCortoGrande(datos, indice + 5);
                return dimensiones(ancho, alto);
            }
            indice += longitudSegmento;
        }

        throw imagenInvalida();
    }

    private MediaImageDimensions dimensionesWebp(byte[] datos) {
        if (datos.length < 30 || !coincideAscii(datos, 0, "RIFF") || !coincideAscii(datos, 8, "WEBP")) {
            throw imagenInvalida();
        }

        int indice = 12;
        while (indice + 8 <= datos.length) {
            String tipoChunk = ascii(datos, indice, 4);
            long tamanioChunk = leerEnteroPequeno(datos, indice + 4);
            long inicioDatos = (long) indice + 8;
            long finDatos = inicioDatos + tamanioChunk;
            if (finDatos > datos.length) throw imagenInvalida();

            if ("VP8X".equals(tipoChunk) && tamanioChunk >= 10) {
                int ancho = 1 + leerEntero24Pequeno(datos, (int) inicioDatos + 4);
                int alto = 1 + leerEntero24Pequeno(datos, (int) inicioDatos + 7);
                return dimensiones(ancho, alto);
            }
            if ("VP8L".equals(tipoChunk) && tamanioChunk >= 5 && sinSigno(datos[(int) inicioDatos]) == 0x2F) {
                int segundo = sinSigno(datos[(int) inicioDatos + 1]);
                int tercero = sinSigno(datos[(int) inicioDatos + 2]);
                int cuarto = sinSigno(datos[(int) inicioDatos + 3]);
                int quinto = sinSigno(datos[(int) inicioDatos + 4]);
                int ancho = 1 + segundo + ((tercero & 0x3F) << 8);
                int alto = 1 + ((tercero >> 6) + (cuarto << 2) + ((quinto & 0x0F) << 10));
                return dimensiones(ancho, alto);
            }
            if ("VP8 ".equals(tipoChunk) && tamanioChunk >= 10
                    && coincide(datos, (int) inicioDatos + 3, 0x9D, 0x01, 0x2A)) {
                int ancho = leerEnteroCortoPequeno(datos, (int) inicioDatos + 6) & 0x3FFF;
                int alto = leerEnteroCortoPequeno(datos, (int) inicioDatos + 8) & 0x3FFF;
                return dimensiones(ancho, alto);
            }

            indice = (int) (finDatos + (tamanioChunk % 2));
        }

        throw imagenInvalida();
    }

    private String normalizarTipo(String tipoContenido) {
        return tipoContenido == null ? "" : tipoContenido.trim().toLowerCase(Locale.ROOT);
    }

    private MediaImageDimensions dimensiones(int ancho, int alto) {
        try {
            return new MediaImageDimensions(ancho, alto);
        } catch (IllegalArgumentException exception) {
            throw imagenInvalida();
        }
    }

    private boolean esMarcadorInicioFrame(int marcador) {
        return marcador >= 0xC0 && marcador <= 0xC3
                || marcador >= 0xC5 && marcador <= 0xC7
                || marcador >= 0xC9 && marcador <= 0xCB
                || marcador >= 0xCD && marcador <= 0xCF;
    }

    private int leerEnteroGrande(byte[] datos, int indice) {
        if (indice + 3 >= datos.length) throw imagenInvalida();
        return (sinSigno(datos[indice]) << 24)
                | (sinSigno(datos[indice + 1]) << 16)
                | (sinSigno(datos[indice + 2]) << 8)
                | sinSigno(datos[indice + 3]);
    }

    private int leerEnteroCortoGrande(byte[] datos, int indice) {
        if (indice + 1 >= datos.length) throw imagenInvalida();
        return (sinSigno(datos[indice]) << 8) | sinSigno(datos[indice + 1]);
    }

    private int leerEnteroCortoPequeno(byte[] datos, int indice) {
        if (indice + 1 >= datos.length) throw imagenInvalida();
        return sinSigno(datos[indice]) | (sinSigno(datos[indice + 1]) << 8);
    }

    private int leerEntero24Pequeno(byte[] datos, int indice) {
        if (indice + 2 >= datos.length) throw imagenInvalida();
        return sinSigno(datos[indice])
                | (sinSigno(datos[indice + 1]) << 8)
                | (sinSigno(datos[indice + 2]) << 16);
    }

    private long leerEnteroPequeno(byte[] datos, int indice) {
        if (indice + 3 >= datos.length) throw imagenInvalida();
        return ((long) sinSigno(datos[indice]))
                | ((long) sinSigno(datos[indice + 1]) << 8)
                | ((long) sinSigno(datos[indice + 2]) << 16)
                | ((long) sinSigno(datos[indice + 3]) << 24);
    }

    private boolean coincide(byte[] datos, int inicio, int... esperados) {
        if (inicio < 0 || inicio + esperados.length > datos.length) return false;
        for (int indice = 0; indice < esperados.length; indice++) {
            if (sinSigno(datos[inicio + indice]) != esperados[indice]) return false;
        }
        return true;
    }

    private boolean coincideAscii(byte[] datos, int inicio, String esperado) {
        return esperado.equals(ascii(datos, inicio, esperado.length()));
    }

    private String ascii(byte[] datos, int inicio, int longitud) {
        if (inicio < 0 || inicio + longitud > datos.length) return "";
        return new String(datos, inicio, longitud, java.nio.charset.StandardCharsets.US_ASCII);
    }

    private int sinSigno(byte valor) {
        return Byte.toUnsignedInt(valor);
    }

    private ReglaNegocioException imagenInvalida() {
        return new ReglaNegocioException("No se pudo validar las dimensiones de la imagen");
    }
}
