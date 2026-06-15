package com.regalia.backend.vendedor.infrastructure.mapper;

import com.regalia.backend.vendedor.api.dto.VendedorResponse;
import com.regalia.backend.vendedor.infrastructure.entity.VendedorEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper para convertir VendedorEntity a DTOs de salida.
 */
@Component
public class VendedorMapper {

    public VendedorResponse toResponse(VendedorEntity entity, Boolean vendedorVerificado) {
        return new VendedorResponse(
                entity.getIdVendedor(),
                entity.getUsuario().getIdUsuario(),
                entity.getUsuario().getNombre(),
                entity.getUsuario().getApellido(),
                entity.getUsuario().getCorreo(),
                vendedorVerificado,
                entity.getEstado(),
                entity.getFechaCreacion(),
                entity.getFechaActualizacion()
        );
    }
}