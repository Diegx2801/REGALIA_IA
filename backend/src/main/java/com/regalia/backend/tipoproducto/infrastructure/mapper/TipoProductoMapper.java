package com.regalia.backend.tipoproducto.infrastructure.mapper;

import com.regalia.backend.tipoproducto.api.dto.TipoProductoRequest;
import com.regalia.backend.tipoproducto.api.dto.TipoProductoResponse;
import com.regalia.backend.tipoproducto.infrastructure.entity.TipoProductoEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper para convertir entre TipoProductoEntity y sus DTOs.
 */
@Component
public class TipoProductoMapper {

    public TipoProductoEntity toEntity(TipoProductoRequest request) {
        TipoProductoEntity entity = new TipoProductoEntity();

        entity.setNombre(normalizarTexto(request.nombre()));
        entity.setEstado(true);

        return entity;
    }

    public TipoProductoResponse toResponse(TipoProductoEntity entity) {
        return new TipoProductoResponse(
                entity.getIdTipoProducto(),
                entity.getNombre(),
                entity.getEstado(),
                entity.getFechaCreacion(),
                entity.getFechaActualizacion()
        );
    }

    public void actualizarEntity(TipoProductoEntity entity, TipoProductoRequest request) {
        entity.setNombre(normalizarTexto(request.nombre()));
    }

    private String normalizarTexto(String texto) {
        return texto.trim();
    }
}