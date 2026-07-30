package com.regalia.backend.tipopago.infrastructure.mapper;

import com.regalia.backend.tipopago.api.dto.TipoPagoResponse;
import com.regalia.backend.tipopago.infrastructure.entity.TipoPagoEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper de lectura entre TipoPagoEntity y TipoPagoResponse.
 */
@Component
public class TipoPagoMapper {

    public TipoPagoResponse toResponse(TipoPagoEntity entity) {
        return new TipoPagoResponse(
                entity.getIdTipoPago(),
                entity.getCodigo(),
                entity.getNombre(),
                entity.getDescripcion(),
                entity.getEstado(),
                entity.getFechaCreacion(),
                entity.getFechaActualizacion()
        );
    }
}
