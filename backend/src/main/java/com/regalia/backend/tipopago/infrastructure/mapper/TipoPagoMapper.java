package com.regalia.backend.tipopago.infrastructure.mapper;

import com.regalia.backend.tipopago.api.dto.TipoPagoRequest;
import com.regalia.backend.tipopago.api.dto.TipoPagoResponse;
import com.regalia.backend.tipopago.infrastructure.entity.TipoPagoEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper encargado de convertir entre DTOs y la entidad TipoPagoEntity.
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

        public void updateEntity(TipoPagoEntity entity, TipoPagoRequest request) {
                entity.setNombre(normalizarTextoObligatorio(request.nombre()));
                entity.setDescripcion(normalizarTextoOpcional(request.descripcion()));
        }

        private String normalizarTextoObligatorio(String texto) {
                return texto.trim();
        }

        private String normalizarTextoOpcional(String texto) {
                if (texto == null || texto.isBlank()) {
                return null;
                }

                return texto.trim();
        }
}