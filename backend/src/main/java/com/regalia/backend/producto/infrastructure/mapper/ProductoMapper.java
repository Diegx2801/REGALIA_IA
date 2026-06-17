package com.regalia.backend.producto.infrastructure.mapper;

import com.regalia.backend.producto.api.dto.ProductoRequest;
import com.regalia.backend.producto.api.dto.ProductoResponse;
import com.regalia.backend.producto.infrastructure.entity.ProductoEntity;
import com.regalia.backend.productoimagen.infrastructure.entity.ProductoImagenEntity;
import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import com.regalia.backend.tipoproducto.infrastructure.entity.TipoProductoEntity;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Mapper para convertir entre ProductoEntity y sus DTOs.
 */
@Component
public class ProductoMapper {

    public ProductoEntity toEntity(
            ProductoRequest request,
            TiendaEntity tienda,
            TipoProductoEntity tipoProducto
    ) {
        ProductoEntity entity = new ProductoEntity();

        entity.setTienda(tienda);
        entity.setTipoProducto(tipoProducto);
        entity.setNombre(normalizarTexto(request.nombre()));
        entity.setDescripcion(normalizarTextoOpcional(request.descripcion()));
        entity.setPrecio(request.precio());
        entity.setStock(request.stock());
        entity.setVisibleEnTienda(request.visibleEnTienda() != null ? request.visibleEnTienda() : true);
        entity.setEstado(true);

        return entity;
    }

    public ProductoResponse toResponse(
            ProductoEntity entity,
            List<ProductoImagenEntity> imagenes
    ) {
        List<ProductoResponse.ImagenResumen> imagenesResumen = imagenes.stream()
                .map(imagen -> new ProductoResponse.ImagenResumen(
                        imagen.getIdProductoImagen(),
                        imagen.getUrlImagen(),
                        imagen.getOrden()
                ))
                .toList();

        return new ProductoResponse(
                entity.getIdProducto(),
                entity.getTienda().getIdTienda(),
                entity.getTienda().getNombre(),
                entity.getTipoProducto().getIdTipoProducto(),
                entity.getTipoProducto().getNombre(),
                entity.getNombre(),
                entity.getDescripcion(),
                entity.getPrecio(),
                entity.getStock(),
                entity.getVisibleEnTienda(),
                imagenesResumen,
                entity.getEstado(),
                entity.getFechaCreacion(),
                entity.getFechaActualizacion()
        );
    }

    public void actualizarEntity(
            ProductoEntity entity,
            ProductoRequest request,
            TipoProductoEntity tipoProducto
    ) {
        entity.setTipoProducto(tipoProducto);
        entity.setNombre(normalizarTexto(request.nombre()));
        entity.setDescripcion(normalizarTextoOpcional(request.descripcion()));
        entity.setPrecio(request.precio());
        entity.setStock(request.stock());
        entity.setVisibleEnTienda(request.visibleEnTienda() != null ? request.visibleEnTienda() : true);
    }

    private String normalizarTexto(String texto) {
        return texto.trim();
    }

    private String normalizarTextoOpcional(String texto) {
        if (texto == null || texto.isBlank()) {
            return null;
        }

        return texto.trim();
    }
}