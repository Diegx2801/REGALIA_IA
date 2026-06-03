package com.regalia.backend.tipopago.infrastructure.mapper;

import com.regalia.backend.tipopago.api.dto.TipoPagoRequest;
import com.regalia.backend.tipopago.api.dto.TipoPagoResponse;
import com.regalia.backend.tipopago.infrastructure.entity.TipoPagoEntity;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * Mapper encargado de convertir entre DTOs y la entidad TipoPagoEntity.
 */
@Component
public class TipoPagoMapper {

        public TipoPagoEntity toEntity(TipoPagoRequest request) {
                TipoPagoEntity entity = new TipoPagoEntity();

                entity.setNombre(normalizarNombre(request.nombre()));
                entity.setDescripcion(request.descripcion());
                entity.setEstado(true);

                return entity;
        }

        public TipoPagoResponse toResponse(TipoPagoEntity entity) {
                return new TipoPagoResponse(
                        entity.getIdTipoPago(),
                        entity.getNombre(),
                        entity.getDescripcion(),
                        entity.getEstado(),
                        entity.getFechaCreacion(),
                        entity.getFechaActualizacion()
                );
        }

        public void updateEntity(TipoPagoEntity entity, TipoPagoRequest request) {
                entity.setNombre(normalizarNombre(request.nombre()));
                entity.setDescripcion(request.descripcion());
        }

        private String normalizarNombre(String nombre) {
                return nombre.trim().toUpperCase(Locale.ROOT);
        }
}