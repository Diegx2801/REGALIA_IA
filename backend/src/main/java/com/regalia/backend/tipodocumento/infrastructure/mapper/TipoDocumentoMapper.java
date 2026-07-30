package com.regalia.backend.tipodocumento.infrastructure.mapper;

import com.regalia.backend.tipodocumento.api.dto.TipoDocumentoResponse;
import com.regalia.backend.tipodocumento.infrastructure.entity.TipoDocumentoEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper de lectura entre TipoDocumentoEntity y TipoDocumentoResponse.
 */
@Component
public class TipoDocumentoMapper {

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
}
