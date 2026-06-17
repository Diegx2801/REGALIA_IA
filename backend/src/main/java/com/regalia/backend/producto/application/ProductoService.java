package com.regalia.backend.producto.application;

import com.regalia.backend.producto.api.dto.ProductoImagenRequest;
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
import com.regalia.backend.tienda.infrastructure.repository.TiendaJpaRepository;
import com.regalia.backend.tipoproducto.infrastructure.entity.TipoProductoEntity;
import com.regalia.backend.tipoproducto.infrastructure.repository.TipoProductoJpaRepository;
import com.regalia.backend.vendedor.infrastructure.entity.VendedorEntity;
import com.regalia.backend.vendedor.infrastructure.repository.VendedorJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Servicio de aplicación para gestionar productos de tiendas del vendedor autenticado.
 */
@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoJpaRepository productoJpaRepository;
    private final ProductoImagenJpaRepository productoImagenJpaRepository;
    private final TiendaJpaRepository tiendaJpaRepository;
    private final TipoProductoJpaRepository tipoProductoJpaRepository;
    private final VendedorJpaRepository vendedorJpaRepository;
    private final ProductoMapper productoMapper;

    @Transactional
    public ProductoResponse crearProducto(String correoUsuario, Long idTienda, ProductoRequest request) {
        VendedorEntity vendedor = obtenerVendedorActivoPorCorreo(correoUsuario);
        TiendaEntity tienda = obtenerTiendaActivaDelVendedor(idTienda, vendedor);
        TipoProductoEntity tipoProducto = obtenerTipoProductoActivo(request.idTipoProducto());

        String nombreNormalizado = normalizarTexto(request.nombre());

        validarNombreProductoDisponibleParaCrear(tienda.getIdTienda(), nombreNormalizado);
        validarOrdenesImagenes(request.imagenes());

        ProductoEntity producto = productoMapper.toEntity(request, tienda, tipoProducto);
        ProductoEntity productoGuardado = productoJpaRepository.save(producto);

        reemplazarImagenes(productoGuardado, request.imagenes());

        return construirResponse(productoGuardado);
    }

    @Transactional(readOnly = true)
    public List<ProductoResponse> listarProductosDeMiTienda(String correoUsuario, Long idTienda) {
        VendedorEntity vendedor = obtenerVendedorActivoPorCorreo(correoUsuario);
        TiendaEntity tienda = obtenerTiendaActivaDelVendedor(idTienda, vendedor);

        return productoJpaRepository.findByTiendaIdTiendaAndEstadoTrueOrderByIdProductoAsc(tienda.getIdTienda())
                .stream()
                .map(this::construirResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductoResponse obtenerProductoPropioPorId(String correoUsuario, Long idProducto) {
        VendedorEntity vendedor = obtenerVendedorActivoPorCorreo(correoUsuario);

        ProductoEntity producto = obtenerProductoActivo(idProducto);

        validarProductoPerteneceAVendedor(producto, vendedor);

        return construirResponse(producto);
    }

    @Transactional
    public ProductoResponse actualizarProducto(String correoUsuario, Long idProducto, ProductoRequest request) {
        VendedorEntity vendedor = obtenerVendedorActivoPorCorreo(correoUsuario);

        ProductoEntity producto = obtenerProductoActivo(idProducto);

        validarProductoPerteneceAVendedor(producto, vendedor);

        TipoProductoEntity tipoProducto = obtenerTipoProductoActivo(request.idTipoProducto());

        String nombreNormalizado = normalizarTexto(request.nombre());

        validarNombreProductoDisponibleParaActualizar(
                producto.getTienda().getIdTienda(),
                nombreNormalizado,
                producto.getIdProducto()
        );

        validarOrdenesImagenes(request.imagenes());

        productoMapper.actualizarEntity(producto, request, tipoProducto);

        ProductoEntity productoActualizado = productoJpaRepository.save(producto);

        reemplazarImagenes(productoActualizado, request.imagenes());

        return construirResponse(productoActualizado);
    }

    @Transactional
    public void desactivarProducto(String correoUsuario, Long idProducto) {
        VendedorEntity vendedor = obtenerVendedorActivoPorCorreo(correoUsuario);

        ProductoEntity producto = obtenerProductoActivo(idProducto);

        validarProductoPerteneceAVendedor(producto, vendedor);

        /*
         * Regla importante:
         * La base de datos no permite que un producto inactivo siga visible.
         * Por eso, al hacer soft delete, primero apagamos visibleEnTienda
         * y luego desactivamos el producto.
         */
        producto.setVisibleEnTienda(false);
        producto.setEstado(false);

        productoJpaRepository.save(producto);

        List<ProductoImagenEntity> imagenesActivas = productoImagenJpaRepository
                .findByProductoIdProductoAndEstadoTrueOrderByOrdenAsc(producto.getIdProducto());

        imagenesActivas.forEach(imagen -> imagen.setEstado(false));

        productoImagenJpaRepository.saveAll(imagenesActivas);
    }

    private VendedorEntity obtenerVendedorActivoPorCorreo(String correoUsuario) {
        return vendedorJpaRepository.findByUsuarioCorreoIgnoreCaseAndEstadoTrue(correoUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró un perfil vendedor activo para el usuario autenticado"
                ));
    }

    private TiendaEntity obtenerTiendaActivaDelVendedor(Long idTienda, VendedorEntity vendedor) {
        TiendaEntity tienda = tiendaJpaRepository.findByIdTiendaAndEstadoTrue(idTienda)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró la tienda solicitada"
                ));

        if (!tienda.getVendedor().getIdVendedor().equals(vendedor.getIdVendedor())) {
            throw new RecursoNoEncontradoException(
                    "No se encontró la tienda solicitada para el vendedor autenticado"
            );
        }

        return tienda;
    }

    private TipoProductoEntity obtenerTipoProductoActivo(Long idTipoProducto) {
        return tipoProductoJpaRepository.findByIdTipoProductoAndEstadoTrue(idTipoProducto)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el tipo de producto solicitado"
                ));
    }

    private ProductoEntity obtenerProductoActivo(Long idProducto) {
        return productoJpaRepository.findByIdProductoAndEstadoTrue(idProducto)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el producto solicitado"
                ));
    }

    private void validarProductoPerteneceAVendedor(ProductoEntity producto, VendedorEntity vendedor) {
        Long idVendedorProducto = producto.getTienda().getVendedor().getIdVendedor();
        Long idVendedorAutenticado = vendedor.getIdVendedor();

        if (!idVendedorProducto.equals(idVendedorAutenticado)) {
            throw new RecursoNoEncontradoException(
                    "No se encontró el producto solicitado para el vendedor autenticado"
            );
        }
    }

    private void validarNombreProductoDisponibleParaCrear(Long idTienda, String nombreProducto) {
        boolean existeProductoActivo = productoJpaRepository
                .existsByTiendaIdTiendaAndNombreIgnoreCaseAndEstadoTrue(idTienda, nombreProducto);

        if (existeProductoActivo) {
            throw new RecursoDuplicadoException(
                    "Ya existe un producto activo con ese nombre en la tienda"
            );
        }
    }

    private void validarNombreProductoDisponibleParaActualizar(
            Long idTienda,
            String nombreProducto,
            Long idProductoActual
    ) {
        boolean existeOtroProductoActivo = productoJpaRepository
                .existsByTiendaIdTiendaAndNombreIgnoreCaseAndEstadoTrueAndIdProductoNot(
                        idTienda,
                        nombreProducto,
                        idProductoActual
                );

        if (existeOtroProductoActivo) {
            throw new RecursoDuplicadoException(
                    "Ya existe otro producto activo con ese nombre en la tienda"
            );
        }
    }

    private void validarOrdenesImagenes(List<ProductoImagenRequest> imagenes) {
        if (imagenes == null || imagenes.isEmpty()) {
            return;
        }

        Set<Integer> ordenes = new HashSet<>();

        for (ProductoImagenRequest imagen : imagenes) {
            if (!ordenes.add(imagen.orden())) {
                throw new RecursoDuplicadoException("No puede haber imágenes con orden repetido");
            }
        }
    }

    private void reemplazarImagenes(ProductoEntity producto, List<ProductoImagenRequest> imagenesRequest) {
        List<ProductoImagenEntity> imagenesActuales = productoImagenJpaRepository
                .findByProductoIdProductoOrderByOrdenAsc(producto.getIdProducto());

        imagenesActuales.forEach(imagen -> imagen.setEstado(false));
        productoImagenJpaRepository.saveAll(imagenesActuales);

        if (imagenesRequest == null || imagenesRequest.isEmpty()) {
            return;
        }

        for (ProductoImagenRequest imagenRequest : imagenesRequest) {
            ProductoImagenEntity imagenExistente = productoImagenJpaRepository
                    .findByProductoIdProductoAndOrden(producto.getIdProducto(), imagenRequest.orden())
                    .orElse(null);

            if (imagenExistente != null) {
                imagenExistente.setUrlImagen(normalizarTexto(imagenRequest.urlImagen()));
                imagenExistente.setEstado(true);
                productoImagenJpaRepository.save(imagenExistente);
            } else {
                ProductoImagenEntity nuevaImagen = new ProductoImagenEntity(
                        producto,
                        normalizarTexto(imagenRequest.urlImagen()),
                        imagenRequest.orden()
                );

                productoImagenJpaRepository.save(nuevaImagen);
            }
        }
    }

    private ProductoResponse construirResponse(ProductoEntity producto) {
        List<ProductoImagenEntity> imagenesActivas = productoImagenJpaRepository
                .findByProductoIdProductoAndEstadoTrueOrderByOrdenAsc(producto.getIdProducto());

        return productoMapper.toResponse(producto, imagenesActivas);
    }

    private String normalizarTexto(String texto) {
        return texto.trim();
    }
}