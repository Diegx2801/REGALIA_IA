package com.regalia.backend.producto.application;

import com.regalia.backend.producto.api.dto.ProductoPublicoResponse;
import com.regalia.backend.producto.infrastructure.entity.ProductoEntity;
import com.regalia.backend.producto.infrastructure.mapper.ProductoMapper;
import com.regalia.backend.producto.infrastructure.repository.ProductoJpaRepository;
import com.regalia.backend.productoimagen.infrastructure.repository.ProductoImagenJpaRepository;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import com.regalia.backend.tienda.infrastructure.repository.TiendaJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio de consulta pública de productos para el marketplace.
 *
 * No gestiona productos del vendedor.
 * Solo consulta productos activos, visibles y pertenecientes a tiendas públicas válidas.
 */
@Service
@RequiredArgsConstructor
public class ProductoConsultaService {

    private static final String ESTADO_REVISION_APROBADA = "APROBADA";

    private final ProductoJpaRepository productoJpaRepository;
    private final ProductoImagenJpaRepository productoImagenJpaRepository;
    private final TiendaJpaRepository tiendaJpaRepository;
    private final ProductoMapper productoMapper;

    @Transactional(readOnly = true)
    public List<ProductoPublicoResponse> listarProductosPublicosDeTienda(Long idTienda) {
        TiendaEntity tienda = obtenerTiendaPublicaActiva(idTienda);

        return productoJpaRepository
                .findByTiendaIdTiendaAndEstadoTrueAndVisibleEnTiendaTrueOrderByIdProductoAsc(tienda.getIdTienda())
                .stream()
                .map(this::construirProductoPublicoResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductoPublicoResponse obtenerProductoPublicoPorId(Long idProducto) {
        ProductoEntity producto = productoJpaRepository
                .findByIdProductoAndEstadoTrueAndVisibleEnTiendaTrue(idProducto)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el producto solicitado"
                ));

        validarProductoPerteneceATiendaPublica(producto);

        return construirProductoPublicoResponse(producto);
    }

    @Transactional(readOnly = true)
    public List<ProductoPublicoResponse> listarProductosPublicos() {
        return productoJpaRepository.findProductosPublicosMarketplace(ESTADO_REVISION_APROBADA)
                .stream()
                .map(this::construirProductoPublicoResponse)
                .toList();
    }

    private TiendaEntity obtenerTiendaPublicaActiva(Long idTienda) {
        return tiendaJpaRepository
                .findTiendaPublicaById(
                        idTienda,
                        ESTADO_REVISION_APROBADA
                )
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró la tienda solicitada"
                ));
    }

    private void validarProductoPerteneceATiendaPublica(ProductoEntity producto) {
        TiendaEntity tienda = producto.getTienda();

        if (tienda == null
                || !Boolean.TRUE.equals(tienda.getEstado())
                || !ESTADO_REVISION_APROBADA.equalsIgnoreCase(tienda.getEstadoRevision())) {
            throw new RecursoNoEncontradoException(
                    "No se encontró el producto solicitado"
            );
        }
    }

    private ProductoPublicoResponse construirProductoPublicoResponse(ProductoEntity producto) {
        List<ProductoPublicoResponse.ImagenResumen> imagenes = productoImagenJpaRepository
                .findByProductoIdProductoAndEstadoTrueOrderByOrdenAsc(producto.getIdProducto())
                .stream()
                .map(productoMapper::toPublicaImagenResumen)
                .toList();

        return productoMapper.toPublicoResponse(
                producto,
                imagenes
        );
    }
}
