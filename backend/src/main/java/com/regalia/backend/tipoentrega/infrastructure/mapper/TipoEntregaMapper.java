package com.regalia.backend.tipoentrega.infrastructure.mapper;

import com.regalia.backend.tipoentrega.api.dto.TipoEntregaResponse;
import com.regalia.backend.tipoentrega.infrastructure.entity.TipoEntregaEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper de lectura entre TipoEntregaEntity y TipoEntregaResponse.
 */
@Component
public class TipoEntregaMapper {

    public TipoEntregaResponse toResponse(TipoEntregaEntity entity) {
        return new TipoEntregaResponse(
                entity.getIdTipoEntrega(),
                entity.getNombre(),
                entity.getEstado(),
                entity.getFechaCreacion(),
                entity.getFechaActualizacion()
        );
    }
}
