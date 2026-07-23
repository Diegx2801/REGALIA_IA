package com.regalia.backend.producto.application;

import com.regalia.backend.producto.api.dto.ProductoRequest;
import com.regalia.backend.producto.api.dto.ProductoResponse;
import com.regalia.backend.producto.infrastructure.entity.ProductoEntity;
import com.regalia.backend.producto.infrastructure.mapper.ProductoMapper;
import com.regalia.backend.producto.infrastructure.repository.ProductoJpaRepository;
import com.regalia.backend.productoimagen.infrastructure.entity.ProductoImagenEntity;
import com.regalia.backend.productoimagen.infrastructure.repository.ProductoImagenJpaRepository;
import com.regalia.backend.shared.exception.RecursoDuplicadoException;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import com.regalia.backend.tipoproducto.infrastructure.entity.TipoProductoEntity;
import com.regalia.backend.tipoproducto.infrastructure.repository.TipoProductoJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Servicio de aplicación para productos del vendedor autenticado. */
@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoJpaRepository productoJpaRepository;
    private final ProductoImagenJpaRepository productoImagenJpaRepository;
    private final TipoProductoJpaRepository tipoProductoJpaRepository;
    private final ProductoMapper productoMapper;
    private final ProductoVendedorAccessService productoVendedorAccessService;

    @Transactional
    public ProductoResponse crearProducto(String correoUsuario, Long idTienda, ProductoRequest request) {
        TiendaEntity tienda = productoVendedorAccessService.obtenerTiendaPropia(correoUsuario, idTienda);
        TipoProductoEntity tipoProducto = obtenerTipoProductoActivo(request.idTipoProducto());
        String nombreNormalizado = normalizarTexto(request.nombre());

        validarNombreProductoDisponibleParaCrear(tienda.getIdTienda(), nombreNormalizado);
        ProductoEntity producto = productoMapper.toEntity(request, tienda, tipoProducto);
        return construirResponse(productoJpaRepository.save(producto));
    }

    @Transactional(readOnly = true)
    public List<ProductoResponse> listarProductosDeMiTienda(String correoUsuario, Long idTienda) {
        TiendaEntity tienda = productoVendedorAccessService.obtenerTiendaPropia(correoUsuario, idTienda);
        return productoJpaRepository.findByTiendaIdTiendaAndEstadoTrueOrderByIdProductoAsc(tienda.getIdTienda())
                .stream().map(this::construirResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProductoResponse obtenerProductoPropioPorId(String correoUsuario, Long idTienda, Long idProducto) {
        return construirResponse(productoVendedorAccessService.obtenerProductoPropio(correoUsuario, idTienda, idProducto));
    }

    @Transactional
    public ProductoResponse actualizarProducto(
            String correoUsuario, Long idTienda, Long idProducto, ProductoRequest request
    ) {
        TiendaEntity tienda = productoVendedorAccessService.obtenerTiendaPropia(correoUsuario, idTienda);
        ProductoEntity producto = productoVendedorAccessService.obtenerProductoPropio(correoUsuario, idTienda, idProducto);
        TipoProductoEntity tipoProducto = obtenerTipoProductoActivo(request.idTipoProducto());
        String nombreNormalizado = normalizarTexto(request.nombre());

        validarNombreProductoDisponibleParaActualizar(tienda.getIdTienda(), nombreNormalizado, producto.getIdProducto());
        productoMapper.actualizarEntity(producto, request, tipoProducto);
        return construirResponse(productoJpaRepository.saveAndFlush(producto));
    }

    @Transactional
    public void desactivarProducto(String correoUsuario, Long idTienda, Long idProducto) {
        ProductoEntity producto = productoVendedorAccessService.obtenerProductoPropio(correoUsuario, idTienda, idProducto);
        producto.setVisibleEnTienda(false);
        producto.setEstado(false);
        productoJpaRepository.save(producto);

        List<ProductoImagenEntity> imagenesActivas = productoImagenJpaRepository
                .findByProductoIdProductoAndEstadoTrueOrderByOrdenAsc(producto.getIdProducto());
        imagenesActivas.forEach(imagen -> imagen.setEstado(false));
        productoImagenJpaRepository.saveAll(imagenesActivas);
    }

    private TipoProductoEntity obtenerTipoProductoActivo(Long idTipoProducto) {
        return tipoProductoJpaRepository.findByIdTipoProductoAndEstadoTrue(idTipoProducto)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el tipo de producto solicitado"));
    }

    private void validarNombreProductoDisponibleParaCrear(Long idTienda, String nombreProducto) {
        if (productoJpaRepository.existsByTiendaIdTiendaAndNombreIgnoreCaseAndEstadoTrue(idTienda, nombreProducto)) {
            throw new RecursoDuplicadoException("Ya existe un producto activo con ese nombre en la tienda");
        }
    }

    private void validarNombreProductoDisponibleParaActualizar(Long idTienda, String nombreProducto, Long idProductoActual) {
        if (productoJpaRepository.existsByTiendaIdTiendaAndNombreIgnoreCaseAndEstadoTrueAndIdProductoNot(
                idTienda, nombreProducto, idProductoActual
        )) {
            throw new RecursoDuplicadoException("Ya existe otro producto activo con ese nombre en la tienda");
        }
    }

    private ProductoResponse construirResponse(ProductoEntity producto) {
        List<ProductoImagenEntity> imagenes = productoImagenJpaRepository
                .findByProductoIdProductoAndEstadoTrueOrderByOrdenAsc(producto.getIdProducto());
        return productoMapper.toResponse(producto, imagenes);
    }

    private String normalizarTexto(String texto) {
        return texto.trim();
    }
}
