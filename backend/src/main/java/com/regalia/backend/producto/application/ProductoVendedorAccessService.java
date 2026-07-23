package com.regalia.backend.producto.application;

import com.regalia.backend.producto.infrastructure.entity.ProductoEntity;
import com.regalia.backend.producto.infrastructure.repository.ProductoJpaRepository;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import com.regalia.backend.tienda.infrastructure.repository.TiendaJpaRepository;
import com.regalia.backend.vendedor.infrastructure.entity.VendedorEntity;
import com.regalia.backend.vendedor.infrastructure.repository.VendedorJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

/** Centraliza la comprobación de propiedad para recursos de catálogo del vendedor. */
@Service
@RequiredArgsConstructor
public class ProductoVendedorAccessService {

    private final VendedorJpaRepository vendedorRepository;
    private final TiendaJpaRepository tiendaRepository;
    private final ProductoJpaRepository productoRepository;

    @Transactional(readOnly = true)
    public TiendaEntity obtenerTiendaPropia(String correoUsuario, Long idTienda) {
        VendedorEntity vendedor = vendedorRepository.findByUsuarioCorreoIgnoreCaseAndEstadoTrue(correoUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró un perfil vendedor activo para el usuario autenticado"
                ));
        TiendaEntity tienda = tiendaRepository.findByIdTiendaAndEstadoTrue(idTienda)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró la tienda solicitada"));
        if (!Objects.equals(tienda.getVendedor().getIdVendedor(), vendedor.getIdVendedor())) {
            throw new RecursoNoEncontradoException("No se encontró la tienda solicitada");
        }
        return tienda;
    }

    @Transactional(readOnly = true)
    public ProductoEntity obtenerProductoPropio(String correoUsuario, Long idTienda, Long idProducto) {
        TiendaEntity tienda = obtenerTiendaPropia(correoUsuario, idTienda);
        ProductoEntity producto = productoRepository.findByIdProductoAndEstadoTrue(idProducto)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el producto solicitado"));
        if (!Objects.equals(producto.getTienda().getIdTienda(), tienda.getIdTienda())) {
            throw new RecursoNoEncontradoException("No se encontró el producto solicitado");
        }
        return producto;
    }
}
