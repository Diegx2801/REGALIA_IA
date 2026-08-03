package com.regalia.backend.tiendaimagen.application;

import com.regalia.backend.media.application.MediaImageDimensions;
import com.regalia.backend.media.application.MediaImageInspector;
import com.regalia.backend.media.application.MediaObjectMetadata;
import com.regalia.backend.media.application.MediaStorage;
import com.regalia.backend.media.application.MediaUploadCommand;
import com.regalia.backend.media.application.MediaUploadTicket;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import com.regalia.backend.tienda.infrastructure.repository.TiendaJpaRepository;
import com.regalia.backend.tiendaimagen.api.dto.CargaImagenTiendaResponse;
import com.regalia.backend.tiendaimagen.api.dto.SolicitudCargaImagenTiendaRequest;
import com.regalia.backend.tiendaimagen.api.dto.TiendaImagenResponse;
import com.regalia.backend.tiendaimagen.infrastructure.entity.TiendaImagenEntity;
import com.regalia.backend.tiendaimagen.infrastructure.entity.TipoImagenTienda;
import com.regalia.backend.tiendaimagen.infrastructure.repository.TiendaImagenJpaRepository;
import com.regalia.backend.vendedor.infrastructure.entity.VendedorEntity;
import com.regalia.backend.vendedor.infrastructure.repository.VendedorJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/** Gestiona la carga y sustitución segura de logo y portada de una tienda. */
@Service
@Slf4j
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "regalia.media", name = "provider", havingValue = "R2")
public class TiendaImagenService {

    private static final Set<String> TIPOS_PERMITIDOS = Set.of("image/jpeg", "image/png", "image/webp");
    private static final int CABECERA_MAXIMA_BYTES = 12;

    private final TiendaJpaRepository tiendaRepository;
    private final VendedorJpaRepository vendedorRepository;
    private final TiendaImagenJpaRepository tiendaImagenRepository;
    private final TiendaImagenProperties properties;
    private final MediaStorage mediaStorage;
    private final MediaImageInspector mediaImageInspector;

    @Transactional(readOnly = true)
    public CargaImagenTiendaResponse solicitarCarga(
            String correoUsuario,
            Long idTienda,
            SolicitudCargaImagenTiendaRequest request
    ) {
        TiendaEntity tienda = obtenerTiendaPropia(correoUsuario, idTienda);
        TipoImagenTienda tipo = TipoImagenTienda.desde(request.tipoImagen());
        validarSolicitud(request);

        String tipoContenido = normalizarTipoContenido(request.tipoContenido());
        String claveTemporal = "temporales/tiendas/" + tienda.getIdTienda() + "/" + tipo.name().toLowerCase(Locale.ROOT)
                + "/" + UUID.randomUUID() + extensionPara(tipoContenido);
        MediaUploadTicket ticket = mediaStorage.generarCargaFirmada(new MediaUploadCommand(
                claveTemporal,
                tipoContenido,
                request.tamanioBytes()
        ));

        return new CargaImagenTiendaResponse(
                tipo.name(),
                claveTemporal,
                ticket.urlCarga(),
                ticket.cabecerasRequeridas(),
                ticket.expiraEn()
        );
    }

    @Transactional
    public TiendaImagenResponse confirmarCarga(
            String correoUsuario,
            Long idTienda,
            String tipoImagen,
            String claveTemporal
    ) {
        TiendaEntity tienda = obtenerTiendaPropia(correoUsuario, idTienda);
        TipoImagenTienda tipo = TipoImagenTienda.desde(tipoImagen);
        validarClaveTemporal(tienda.getIdTienda(), tipo, claveTemporal);

        MediaObjectMetadata metadata = mediaStorage.obtenerMetadata(claveTemporal);
        String tipoContenido = normalizarTipoContenido(metadata.tipoContenido());
        validarArchivoAlmacenado(metadata, tipoContenido, mediaStorage.leerCabecera(claveTemporal, CABECERA_MAXIMA_BYTES));
        MediaImageDimensions dimensiones = mediaImageInspector.obtenerDimensiones(
                tipoContenido,
                mediaStorage.leerObjeto(claveTemporal, properties.getMaxSizeBytes())
        );
        validarDimensiones(tipo, dimensiones);

        String claveFinal = "tiendas/" + tienda.getIdTienda() + "/" + tipo.name().toLowerCase(Locale.ROOT)
                + "/" + UUID.randomUUID() + extensionPara(tipoContenido);
        mediaStorage.promoverObjeto(claveTemporal, claveFinal, tipoContenido);
        eliminarObjetoFinalSiNoConfirmaTransaccion(claveFinal);

        TiendaImagenEntity imagen = tiendaImagenRepository
                .findByTiendaIdTiendaAndTipo(tienda.getIdTienda(), tipo)
                .orElse(null);
        String claveAnterior = imagen == null ? null : imagen.getClaveAlmacenamiento();

        if (imagen == null) {
            imagen = new TiendaImagenEntity(
                    tienda,
                    tipo,
                    mediaStorage.construirUrlPublica(claveFinal),
                    claveFinal,
                    tipoContenido,
                    dimensiones.ancho(),
                    dimensiones.alto()
            );
        } else {
            imagen.setUrlImagen(mediaStorage.construirUrlPublica(claveFinal));
            imagen.setClaveAlmacenamiento(claveFinal);
            imagen.setTipoContenido(tipoContenido);
            imagen.setAncho(dimensiones.ancho());
            imagen.setAlto(dimensiones.alto());
        }

        TiendaImagenEntity guardada = tiendaImagenRepository.saveAndFlush(imagen);
        eliminarObjetosDespuesDeConfirmarTransaccion(claveTemporal, claveAnterior);
        return respuesta(guardada);
    }

    private TiendaEntity obtenerTiendaPropia(String correoUsuario, Long idTienda) {
        VendedorEntity vendedor = vendedorRepository.findByUsuarioCorreoIgnoreCaseAndEstadoTrue(correoUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro un perfil vendedor activo"));

        return tiendaRepository.findByIdTiendaAndEstadoTrue(idTienda)
                .filter(tienda -> tienda.getVendedor().getIdVendedor().equals(vendedor.getIdVendedor()))
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro la tienda solicitada"));
    }

    private void validarSolicitud(SolicitudCargaImagenTiendaRequest request) {
        if (request.tamanioBytes() > properties.getMaxSizeBytes()) {
            throw new ReglaNegocioException("La imagen supera el tamaño maximo permitido de 5 MB");
        }
        normalizarTipoContenido(request.tipoContenido());
    }

    private void validarArchivoAlmacenado(MediaObjectMetadata metadata, String tipoContenido, byte[] cabecera) {
        if (metadata.tamanioBytes() < 1 || metadata.tamanioBytes() > properties.getMaxSizeBytes()) {
            throw new ReglaNegocioException("La imagen almacenada supera el tamaño maximo permitido");
        }
        if (!tieneFirmaValida(tipoContenido, cabecera)) {
            throw new ReglaNegocioException("El archivo no coincide con el tipo de imagen declarado");
        }
    }

    private void validarDimensiones(TipoImagenTienda tipo, MediaImageDimensions dimensiones) {
        if ((long) dimensiones.ancho() * dimensiones.alto() > properties.getMaxPixels()) {
            throw new ReglaNegocioException("La imagen supera las dimensiones permitidas");
        }

        if (tipo == TipoImagenTienda.LOGO) {
            validarRango(
                    dimensiones,
                    properties.getLogoMinWidth(),
                    properties.getLogoMinHeight(),
                    properties.getLogoMinAspectRatio(),
                    properties.getLogoMaxAspectRatio(),
                    "El logo debe ser cuadrado y tener al menos 512 por 512 pixeles"
            );
            return;
        }

        validarRango(
                dimensiones,
                properties.getCoverMinWidth(),
                properties.getCoverMinHeight(),
                properties.getCoverMinAspectRatio(),
                properties.getCoverMaxAspectRatio(),
                "La portada debe ser horizontal y tener al menos 1500 por 500 pixeles"
        );
    }

    private void validarRango(
            MediaImageDimensions dimensiones,
            int anchoMinimo,
            int altoMinimo,
            double proporcionMinima,
            double proporcionMaxima,
            String mensaje
    ) {
        double proporcion = dimensiones.proporcion();
        if (dimensiones.ancho() < anchoMinimo
                || dimensiones.alto() < altoMinimo
                || proporcion < proporcionMinima
                || proporcion > proporcionMaxima) {
            throw new ReglaNegocioException(mensaje);
        }
    }

    private void validarClaveTemporal(Long idTienda, TipoImagenTienda tipo, String claveTemporal) {
        String prefijoEsperado = "temporales/tiendas/" + idTienda + "/" + tipo.name().toLowerCase(Locale.ROOT) + "/";
        if (claveTemporal == null || !claveTemporal.startsWith(prefijoEsperado)) {
            throw new ReglaNegocioException("La carga temporal no corresponde a la imagen de tienda indicada");
        }
    }

    private String normalizarTipoContenido(String tipoContenido) {
        String tipo = tipoContenido == null ? "" : tipoContenido.trim().toLowerCase(Locale.ROOT);
        if (!TIPOS_PERMITIDOS.contains(tipo)) {
            throw new ReglaNegocioException("Solo puedes usar imágenes JPEG, PNG o WebP");
        }
        return tipo;
    }

    private String extensionPara(String tipoContenido) {
        return switch (tipoContenido) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> throw new IllegalArgumentException("Tipo de contenido no soportado");
        };
    }

    private boolean tieneFirmaValida(String tipoContenido, byte[] cabecera) {
        return switch (tipoContenido) {
            case "image/jpeg" -> cabecera.length >= 3
                    && Byte.toUnsignedInt(cabecera[0]) == 0xFF
                    && Byte.toUnsignedInt(cabecera[1]) == 0xD8
                    && Byte.toUnsignedInt(cabecera[2]) == 0xFF;
            case "image/png" -> cabecera.length >= 8
                    && Byte.toUnsignedInt(cabecera[0]) == 0x89
                    && cabecera[1] == 'P' && cabecera[2] == 'N' && cabecera[3] == 'G'
                    && Byte.toUnsignedInt(cabecera[4]) == 0x0D
                    && Byte.toUnsignedInt(cabecera[5]) == 0x0A
                    && Byte.toUnsignedInt(cabecera[6]) == 0x1A
                    && Byte.toUnsignedInt(cabecera[7]) == 0x0A;
            case "image/webp" -> cabecera.length >= 12
                    && cabecera[0] == 'R' && cabecera[1] == 'I' && cabecera[2] == 'F' && cabecera[3] == 'F'
                    && cabecera[8] == 'W' && cabecera[9] == 'E' && cabecera[10] == 'B' && cabecera[11] == 'P';
            default -> false;
        };
    }

    private TiendaImagenResponse respuesta(TiendaImagenEntity imagen) {
        return new TiendaImagenResponse(
                imagen.getTipo().name(),
                imagen.getUrlImagen(),
                imagen.getAncho(),
                imagen.getAlto()
        );
    }

    private void eliminarObjetosDespuesDeConfirmarTransaccion(String claveTemporal, String claveAnterior) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                eliminarSilenciosamente(claveTemporal);
                if (claveAnterior != null && !claveAnterior.equals(claveTemporal)) {
                    eliminarSilenciosamente(claveAnterior);
                }
            }
        });
    }

    private void eliminarObjetoFinalSiNoConfirmaTransaccion(String claveFinal) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int estado) {
                if (estado != TransactionSynchronization.STATUS_COMMITTED) {
                    eliminarSilenciosamente(claveFinal);
                }
            }
        });
    }

    private void eliminarSilenciosamente(String clave) {
        try {
            mediaStorage.eliminarObjeto(clave);
        } catch (RuntimeException exception) {
            log.warn(
                    "No se pudo limpiar un medio reemplazado de tienda. exceptionType={}",
                    exception.getClass().getSimpleName()
            );
        }
    }
}
