package com.regalia.backend.tipoproducto.infrastructure.mapper;

import com.regalia.backend.tipoproducto.api.dto.TipoProductoResponse;
import com.regalia.backend.tipoproducto.infrastructure.entity.TipoProductoEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper de lectura entre TipoProductoEntity y TipoProductoResponse.
 */
@Component
public class TipoProductoMapper {

    public TipoProductoResponse toResponse(TipoProductoEntity entity) {
        return new TipoProductoResponse(
                entity.getIdTipoProducto(),
                entity.getNombre(),
                entity.getEstado(),
                entity.getFechaCreacion(),
                entity.getFechaActualizacion()
        );
    }
}
