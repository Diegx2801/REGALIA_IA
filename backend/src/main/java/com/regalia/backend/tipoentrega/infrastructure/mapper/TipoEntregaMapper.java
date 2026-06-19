package com.regalia.backend.tipoentrega.infrastructure.mapper;

import com.regalia.backend.tipoentrega.api.dto.TipoEntregaRequest;
import com.regalia.backend.tipoentrega.api.dto.TipoEntregaResponse;
import com.regalia.backend.tipoentrega.infrastructure.entity.TipoEntregaEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper para convertir entre TipoEntregaEntity y sus DTOs.
 */
@Component
public class TipoEntregaMapper {

    public TipoEntregaEntity toEntity(TipoEntregaRequest request) {
        TipoEntregaEntity entity = new TipoEntregaEntity();

        entity.setNombre(normalizarTexto(request.nombre()));
        entity.setEstado(true);

        return entity;
    }

    public TipoEntregaResponse toResponse(TipoEntregaEntity entity) {
        return new TipoEntregaResponse(
                entity.getIdTipoEntrega(),
                entity.getNombre(),
                entity.getEstado(),
                entity.getFechaCreacion(),
                entity.getFechaActualizacion()
        );
    }

    public void actualizarEntity(TipoEntregaEntity entity, TipoEntregaRequest request) {
        entity.setNombre(normalizarTexto(request.nombre()));
    }

    private String normalizarTexto(String texto) {
        return texto.trim();
    }
}