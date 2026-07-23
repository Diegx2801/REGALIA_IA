package com.regalia.backend.productoimagen.application;

import com.regalia.backend.media.application.MediaObjectMetadata;
import com.regalia.backend.media.application.MediaStorage;
import com.regalia.backend.media.application.MediaUploadCommand;
import com.regalia.backend.media.application.MediaUploadTicket;
import com.regalia.backend.producto.api.dto.ProductoResponse;
import com.regalia.backend.producto.application.ProductoVendedorAccessService;
import com.regalia.backend.producto.infrastructure.entity.ProductoEntity;
import com.regalia.backend.productoimagen.api.dto.CargaImagenProductoResponse;
import com.regalia.backend.productoimagen.api.dto.SolicitudCargaImagenProductoRequest;
import com.regalia.backend.productoimagen.infrastructure.entity.ProductoImagenEntity;
import com.regalia.backend.productoimagen.infrastructure.repository.ProductoImagenJpaRepository;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/** Gestiona el ciclo seguro de imágenes sin acoplar el dominio al proveedor R2. */
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "regalia.media", name = "provider", havingValue = "R2")
public class ProductoImagenService {

    private static final Set<String> TIPOS_PERMITIDOS = Set.of("image/jpeg", "image/png", "image/webp");
    private static final int CABECERA_MAXIMA_BYTES = 12;

    private final ProductoImagenJpaRepository productoImagenRepository;
    private final ProductoVendedorAccessService productoVendedorAccessService;
    private final ProductoImagenProperties properties;
    private final MediaStorage mediaStorage;

    @Transactional(readOnly = true)
    public CargaImagenProductoResponse solicitarCarga(
            String correoUsuario,
            Long idTienda,
            Long idProducto,
            SolicitudCargaImagenProductoRequest request
    ) {
        ProductoEntity producto = obtenerProductoPropio(correoUsuario, idTienda, idProducto);
        validarSolicitud(request);
        validarCupoDisponible(producto.getIdProducto());

        String tipoContenido = normalizarTipoContenido(request.tipoContenido());
        String claveTemporal = "temporales/productos/" + producto.getIdProducto() + "/" + UUID.randomUUID()
                + extensionPara(tipoContenido);
        MediaUploadTicket ticket = mediaStorage.generarCargaFirmada(new MediaUploadCommand(
                claveTemporal,
                tipoContenido,
                request.tamanioBytes()
        ));

        return new CargaImagenProductoResponse(
                claveTemporal,
                ticket.urlCarga(),
                ticket.cabecerasRequeridas(),
                ticket.expiraEn()
        );
    }

    @Transactional
    public ProductoResponse.ImagenResumen confirmarCarga(
            String correoUsuario,
            Long idTienda,
            Long idProducto,
            String claveTemporal
    ) {
        ProductoEntity producto = obtenerProductoPropio(correoUsuario, idTienda, idProducto);
        validarClaveTemporalDeProducto(producto.getIdProducto(), claveTemporal);
        validarCupoDisponible(producto.getIdProducto());

        MediaObjectMetadata metadata = mediaStorage.obtenerMetadata(claveTemporal);
        String tipoContenido = normalizarTipoContenido(metadata.tipoContenido());
        validarArchivoAlmacenado(metadata, tipoContenido, mediaStorage.leerCabecera(claveTemporal, CABECERA_MAXIMA_BYTES));

        String claveFinal = "productos/" + producto.getIdProducto() + "/" + UUID.randomUUID()
                + extensionPara(tipoContenido);
        mediaStorage.copiarObjeto(claveTemporal, claveFinal);
        mediaStorage.eliminarObjeto(claveTemporal);

        int orden = productoImagenRepository
                .findByProductoIdProductoAndEstadoTrueOrderByOrdenAsc(producto.getIdProducto())
                .size() + 1;
        ProductoImagenEntity imagen = productoImagenRepository.save(new ProductoImagenEntity(
                producto,
                mediaStorage.construirUrlPublica(claveFinal),
                claveFinal,
                orden
        ));
        return resumen(imagen);
    }

    @Transactional
    public void eliminarImagen(String correoUsuario, Long idTienda, Long idProducto, Long idProductoImagen) {
        ProductoEntity producto = obtenerProductoPropio(correoUsuario, idTienda, idProducto);
        ProductoImagenEntity imagen = productoImagenRepository
                .findByIdProductoImagenAndProductoIdProductoAndEstadoTrue(idProductoImagen, producto.getIdProducto())
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró la imagen solicitada"));

        if (imagen.getClaveAlmacenamiento() != null) {
            mediaStorage.eliminarObjeto(imagen.getClaveAlmacenamiento());
        }
        imagen.setEstado(false);
        productoImagenRepository.save(imagen);
        normalizarOrden(producto.getIdProducto());
    }

    @Transactional
    public List<ProductoResponse.ImagenResumen> ordenarImagenes(
            String correoUsuario,
            Long idTienda,
            Long idProducto,
            List<Long> idsProductoImagen
    ) {
        ProductoEntity producto = obtenerProductoPropio(correoUsuario, idTienda, idProducto);
        List<ProductoImagenEntity> activas = productoImagenRepository
                .findByProductoIdProductoAndEstadoTrueOrderByOrdenAsc(producto.getIdProducto());

        Set<Long> idsSolicitados = new HashSet<>(idsProductoImagen);
        if (idsSolicitados.size() != idsProductoImagen.size() || idsSolicitados.size() != activas.size()) {
            throw new ReglaNegocioException("El orden de imágenes enviado no es válido");
        }
        Set<Long> idsActivos = activas.stream().map(ProductoImagenEntity::getIdProductoImagen).collect(java.util.stream.Collectors.toSet());
        if (!idsActivos.equals(idsSolicitados)) {
            throw new ReglaNegocioException("El orden debe incluir exactamente las imágenes activas del producto");
        }

        List<ProductoImagenEntity> porOrden = new ArrayList<>();
        for (int indice = 0; indice < idsProductoImagen.size(); indice++) {
            Long idImagen = idsProductoImagen.get(indice);
            ProductoImagenEntity imagen = activas.stream()
                    .filter(actual -> Objects.equals(actual.getIdProductoImagen(), idImagen))
                    .findFirst()
                    .orElseThrow();
            imagen.setOrden(indice + 1);
            porOrden.add(imagen);
        }
        productoImagenRepository.saveAll(porOrden);
        return porOrden.stream().map(this::resumen).toList();
    }

    private ProductoEntity obtenerProductoPropio(String correoUsuario, Long idTienda, Long idProducto) {
        return productoVendedorAccessService.obtenerProductoPropio(correoUsuario, idTienda, idProducto);
    }

    private void validarSolicitud(SolicitudCargaImagenProductoRequest request) {
        if (request.tamanioBytes() > properties.getMaxSizeBytes()) {
            throw new ReglaNegocioException("La imagen supera el tamaño máximo permitido de 5 MB");
        }
        normalizarTipoContenido(request.tipoContenido());
    }

    private void validarArchivoAlmacenado(MediaObjectMetadata metadata, String tipoContenido, byte[] cabecera) {
        if (metadata.tamanioBytes() < 1 || metadata.tamanioBytes() > properties.getMaxSizeBytes()) {
            throw new ReglaNegocioException("La imagen almacenada supera el tamaño máximo permitido");
        }
        if (!tieneFirmaValida(tipoContenido, cabecera)) {
            throw new ReglaNegocioException("El archivo no coincide con el tipo de imagen declarado");
        }
    }

    private void validarCupoDisponible(Long idProducto) {
        int cantidad = productoImagenRepository
                .findByProductoIdProductoAndEstadoTrueOrderByOrdenAsc(idProducto)
                .size();
        if (cantidad >= properties.getMaxCount()) {
            throw new ReglaNegocioException("Un producto puede tener como máximo " + properties.getMaxCount() + " imágenes");
        }
    }

    private void validarClaveTemporalDeProducto(Long idProducto, String claveTemporal) {
        String prefijoEsperado = "temporales/productos/" + idProducto + "/";
        if (claveTemporal == null || !claveTemporal.startsWith(prefijoEsperado)) {
            throw new ReglaNegocioException("La carga temporal no corresponde al producto indicado");
        }
    }

    private void normalizarOrden(Long idProducto) {
        List<ProductoImagenEntity> activas = productoImagenRepository
                .findByProductoIdProductoAndEstadoTrueOrderByOrdenAsc(idProducto);
        for (int indice = 0; indice < activas.size(); indice++) {
            activas.get(indice).setOrden(indice + 1);
        }
        productoImagenRepository.saveAll(activas);
    }

    private String normalizarTipoContenido(String tipoContenido) {
        String normalizado = tipoContenido == null ? "" : tipoContenido.trim().toLowerCase(Locale.ROOT);
        if (!TIPOS_PERMITIDOS.contains(normalizado)) {
            throw new ReglaNegocioException("Solo se permiten imágenes JPEG, PNG o WebP");
        }
        return normalizado;
    }

    private boolean tieneFirmaValida(String tipoContenido, byte[] cabecera) {
        return switch (tipoContenido) {
            case "image/jpeg" -> cabecera.length >= 3
                    && (cabecera[0] & 0xFF) == 0xFF && (cabecera[1] & 0xFF) == 0xD8 && (cabecera[2] & 0xFF) == 0xFF;
            case "image/png" -> cabecera.length >= 8
                    && (cabecera[0] & 0xFF) == 0x89 && cabecera[1] == 0x50 && cabecera[2] == 0x4E
                    && cabecera[3] == 0x47 && cabecera[4] == 0x0D && cabecera[5] == 0x0A
                    && cabecera[6] == 0x1A && cabecera[7] == 0x0A;
            case "image/webp" -> cabecera.length >= 12
                    && cabecera[0] == 0x52 && cabecera[1] == 0x49 && cabecera[2] == 0x46 && cabecera[3] == 0x46
                    && cabecera[8] == 0x57 && cabecera[9] == 0x45 && cabecera[10] == 0x42 && cabecera[11] == 0x50;
            default -> false;
        };
    }

    private String extensionPara(String tipoContenido) {
        return switch (tipoContenido) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> throw new IllegalArgumentException("Tipo de contenido no soportado");
        };
    }

    private ProductoResponse.ImagenResumen resumen(ProductoImagenEntity imagen) {
        return new ProductoResponse.ImagenResumen(
                imagen.getIdProductoImagen(),
                imagen.getUrlImagen(),
                imagen.getOrden()
        );
    }
}
