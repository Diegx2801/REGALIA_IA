package com.regalia.backend.rubro.infrastructure.mapper;

import com.regalia.backend.rubro.api.dto.RubroResponse;
import com.regalia.backend.rubro.infrastructure.entity.RubroEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper de lectura entre RubroEntity y RubroResponse.
 */
@Component
public class RubroMapper {

    public RubroResponse toResponse(RubroEntity entity) {
        return new RubroResponse(
                entity.getIdRubro(),
                entity.getNombre(),
                entity.getDescripcion(),
                entity.getEstado(),
                entity.getFechaCreacion(),
                entity.getFechaActualizacion()
        );
    }
}
