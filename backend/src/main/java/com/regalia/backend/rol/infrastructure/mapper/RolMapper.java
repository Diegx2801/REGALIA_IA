package com.regalia.backend.rol.infrastructure.mapper;

import com.regalia.backend.rol.api.dto.RolResponse;
import com.regalia.backend.rol.infrastructure.entity.RolEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper encargado de convertir la entidad RolEntity a DTO de respuesta.
 */
@Component
public class RolMapper {

    public RolResponse toResponse(RolEntity entity) {
        return new RolResponse(
                entity.getIdRol(),
                entity.getNombre(),
                entity.getEstado(),
                entity.getFechaCreacion(),
                entity.getFechaActualizacion()
        );
    }
}