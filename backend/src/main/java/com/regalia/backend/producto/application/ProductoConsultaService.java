package com.regalia.backend.producto.application;

import com.regalia.backend.producto.api.dto.ProductoPublicoResponse;
import com.regalia.backend.producto.infrastructure.entity.ProductoEntity;
import com.regalia.backend.producto.infrastructure.mapper.ProductoMapper;
import com.regalia.backend.producto.infrastructure.repository.ProductoJpaRepository;
import com.regalia.backend.productoimagen.infrastructure.repository.ProductoImagenJpaRepository;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.shared.response.PaginaResponse;
import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import com.regalia.backend.tienda.infrastructure.repository.TiendaJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

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
    private static final int TAMANIO_PAGINA_PREDETERMINADO = 12;
    private static final int TAMANIO_PAGINA_MAXIMO = 50;
    private static final int LONGITUD_BUSQUEDA_MAXIMA = 100;

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
    public PaginaResponse<ProductoPublicoResponse> listarProductosPublicos(
            String search,
            Long idTipoProducto,
            BigDecimal precioMaximo,
            Boolean soloDisponibles,
            Integer page,
            Integer size,
            String sort
    ) {
        String busqueda = normalizarBusqueda(search);
        Long tipoProducto = normalizarTipoProducto(idTipoProducto);
        BigDecimal precio = normalizarPrecioMaximo(precioMaximo);
        int pagina = normalizarPagina(page);
        int tamanioPagina = normalizarTamanioPagina(size);
        ProductoPublicoSortField campoOrden = ProductoPublicoSortField.desde(sort);
        Sort.Direction direccionOrden = ProductoPublicoSortField.direccionDesde(sort);
        Pageable pageable = PageRequest.of(pagina, tamanioPagina);

        Page<ProductoEntity> productos = productoJpaRepository.findPaginaProductosPublicosMarketplace(
                ESTADO_REVISION_APROBADA,
                busqueda,
                tipoProducto,
                precio,
                Boolean.TRUE.equals(soloDisponibles),
                campoOrden,
                direccionOrden,
                pageable
        );

        Map<Long, List<ProductoPublicoResponse.ImagenResumen>> imagenesPorProducto =
                cargarImagenesPorProducto(productos.getContent());
        List<ProductoPublicoResponse> contenido = productos.getContent()
                .stream()
                .map(producto -> productoMapper.toPublicoResponse(
                        producto,
                        imagenesPorProducto.getOrDefault(producto.getIdProducto(), List.of())
                ))
                .toList();

        return new PaginaResponse<>(
                contenido,
                productos.getNumber(),
                productos.getSize(),
                productos.getTotalElements(),
                productos.getTotalPages(),
                productos.isLast()
        );
    }

    private Map<Long, List<ProductoPublicoResponse.ImagenResumen>> cargarImagenesPorProducto(
            List<ProductoEntity> productos
    ) {
        List<Long> idsProducto = productos.stream()
                .map(ProductoEntity::getIdProducto)
                .toList();

        if (idsProducto.isEmpty()) {
            return Map.of();
        }

        return productoImagenJpaRepository
                .findByProductoIdProductoInAndEstadoTrueOrderByProductoIdProductoAscOrdenAsc(idsProducto)
                .stream()
                .collect(Collectors.groupingBy(
                        imagen -> imagen.getProducto().getIdProducto(),
                        LinkedHashMap::new,
                        Collectors.mapping(
                                productoMapper::toPublicaImagenResumen,
                                Collectors.toList()
                        )
                ));
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

    private String normalizarBusqueda(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }

        String busqueda = Normalizer.normalize(search.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);

        if (busqueda.length() > LONGITUD_BUSQUEDA_MAXIMA) {
            throw new ReglaNegocioException(
                    "La busqueda no puede superar " + LONGITUD_BUSQUEDA_MAXIMA + " caracteres"
            );
        }

        return busqueda;
    }

    private Long normalizarTipoProducto(Long idTipoProducto) {
        if (idTipoProducto == null) {
            return null;
        }

        if (idTipoProducto < 1) {
            throw new ReglaNegocioException("El tipo de producto no es valido");
        }

        return idTipoProducto;
    }

    private BigDecimal normalizarPrecioMaximo(BigDecimal precioMaximo) {
        if (precioMaximo == null) {
            return null;
        }

        if (precioMaximo.signum() <= 0) {
            throw new ReglaNegocioException("El precio maximo debe ser mayor a cero");
        }

        return precioMaximo;
    }

    private int normalizarPagina(Integer page) {
        if (page == null) {
            return 0;
        }

        if (page < 0) {
            throw new ReglaNegocioException("La pagina no puede ser negativa");
        }

        return page;
    }

    private int normalizarTamanioPagina(Integer size) {
        if (size == null) {
            return TAMANIO_PAGINA_PREDETERMINADO;
        }

        if (size < 1 || size > TAMANIO_PAGINA_MAXIMO) {
            throw new ReglaNegocioException(
                    "El tamanio de pagina debe estar entre 1 y " + TAMANIO_PAGINA_MAXIMO
            );
        }

        return size;
    }
}
