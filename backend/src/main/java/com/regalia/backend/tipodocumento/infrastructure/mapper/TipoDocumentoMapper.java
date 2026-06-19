package com.regalia.backend.tipodocumento.infrastructure.mapper;

import com.regalia.backend.categoriadocumento.infrastructure.entity.CategoriaDocumentoEntity;
import com.regalia.backend.tipodocumento.api.dto.TipoDocumentoRequest;
import com.regalia.backend.tipodocumento.api.dto.TipoDocumentoResponse;
import com.regalia.backend.tipodocumento.infrastructure.entity.TipoDocumentoEntity;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * Mapper para convertir entre TipoDocumentoEntity y sus DTOs.
 */
@Component
public class TipoDocumentoMapper {

    public TipoDocumentoEntity toEntity(
            TipoDocumentoRequest request,
            CategoriaDocumentoEntity categoriaDocumento
    ) {
        TipoDocumentoEntity entity = new TipoDocumentoEntity();

        entity.setCategoriaDocumento(categoriaDocumento);
        entity.setNombre(normalizarTexto(request.nombre()));
        entity.setAbreviatura(normalizarTexto(request.abreviatura()));
        entity.setLongitudMinima(request.longitudMinima());
        entity.setLongitudMaxima(request.longitudMaxima());
        entity.setEstado(true);

        return entity;
    }

    public TipoDocumentoResponse toResponse(TipoDocumentoEntity entity) {
        return new TipoDocumentoResponse(
                entity.getIdTipoDocumento(),
                entity.getCategoriaDocumento().getIdCategoriaDocumento(),
                entity.getCategoriaDocumento().getNombre(),
                entity.getNombre(),
                entity.getAbreviatura(),
                entity.getLongitudMinima(),
                entity.getLongitudMaxima(),
                entity.getEstado(),
                entity.getFechaCreacion(),
                entity.getFechaActualizacion()
        );
    }

    public void updateEntity(
            TipoDocumentoEntity entity,
            TipoDocumentoRequest request,
            CategoriaDocumentoEntity categoriaDocumento
    ) {
        entity.setCategoriaDocumento(categoriaDocumento);
        entity.setNombre(normalizarTexto(request.nombre()));
        entity.setAbreviatura(normalizarTexto(request.abreviatura()));
        entity.setLongitudMinima(request.longitudMinima());
        entity.setLongitudMaxima(request.longitudMaxima());
    }

    private String normalizarTexto(String texto) {
        return texto.trim().toUpperCase(Locale.ROOT);
    }
}