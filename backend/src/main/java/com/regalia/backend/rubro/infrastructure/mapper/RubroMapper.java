package com.regalia.backend.rubro.infrastructure.mapper;

import com.regalia.backend.rubro.api.dto.RubroRequest;
import com.regalia.backend.rubro.api.dto.RubroResponse;
import com.regalia.backend.rubro.infrastructure.entity.RubroEntity;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * Mapper para convertir entre RubroEntity y sus DTOs.
 */
@Component
public class RubroMapper {

    public RubroEntity toEntity(RubroRequest request) {
        RubroEntity entity = new RubroEntity();

        entity.setNombre(normalizarNombre(request.nombre()));
        entity.setDescripcion(normalizarTextoOpcional(request.descripcion()));
        entity.setEstado(true);

        return entity;
    }

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

    public void actualizarEntity(RubroEntity entity, RubroRequest request) {
        entity.setNombre(normalizarNombre(request.nombre()));
        entity.setDescripcion(normalizarTextoOpcional(request.descripcion()));
    }

    public String normalizarNombre(String nombre) {
        return nombre.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizarTextoOpcional(String texto) {
        if (texto == null || texto.isBlank()) {
            return null;
        }

        return texto.trim();
    }
}