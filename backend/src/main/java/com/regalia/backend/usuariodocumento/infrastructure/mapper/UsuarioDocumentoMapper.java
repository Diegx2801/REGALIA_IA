package com.regalia.backend.usuariodocumento.infrastructure.mapper;

import com.regalia.backend.tipodocumento.infrastructure.entity.TipoDocumentoEntity;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuariodocumento.api.dto.AdminUsuarioDocumentoResponse;
import com.regalia.backend.usuariodocumento.api.dto.UsuarioDocumentoRequest;
import com.regalia.backend.usuariodocumento.api.dto.UsuarioDocumentoResponse;
import com.regalia.backend.usuariodocumento.infrastructure.entity.UsuarioDocumentoEntity;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * Mapper para convertir entre UsuarioDocumentoEntity y sus DTOs.
 */
@Component
public class UsuarioDocumentoMapper {

    public UsuarioDocumentoEntity toEntity(
            UsuarioDocumentoRequest request,
            UsuarioEntity usuario,
            TipoDocumentoEntity tipoDocumento
    ) {
        UsuarioDocumentoEntity entity = new UsuarioDocumentoEntity();

        entity.setUsuario(usuario);
        entity.setTipoDocumento(tipoDocumento);
        entity.setNumeroDocumento(normalizarDocumento(request.numeroDocumento()));
        entity.setEstadoVerificacion("PENDIENTE");
        entity.setEstado(true);

        return entity;
    }

    public UsuarioDocumentoResponse toResponse(UsuarioDocumentoEntity entity) {
        return new UsuarioDocumentoResponse(
                entity.getIdUsuarioDocumento(),
                entity.getTipoDocumento().getIdTipoDocumento(),
                entity.getTipoDocumento().getNombre(),
                entity.getTipoDocumento().getAbreviatura(),
                entity.getTipoDocumento().getCategoriaDocumento().getIdCategoriaDocumento(),
                entity.getTipoDocumento().getCategoriaDocumento().getNombre(),
                entity.getNumeroDocumento(),
                entity.getEstadoVerificacion(),
                entity.getEstado(),
                entity.getFechaCreacion(),
                entity.getFechaActualizacion()
        );
    }

    public AdminUsuarioDocumentoResponse toAdminResponse(UsuarioDocumentoEntity entity) {
        return new AdminUsuarioDocumentoResponse(
                entity.getIdUsuarioDocumento(),
                entity.getUsuario().getIdUsuario(),
                entity.getUsuario().getNombre(),
                entity.getUsuario().getApellido(),
                entity.getUsuario().getCorreo(),
                entity.getTipoDocumento().getIdTipoDocumento(),
                entity.getTipoDocumento().getNombre(),
                entity.getTipoDocumento().getAbreviatura(),
                entity.getTipoDocumento().getCategoriaDocumento().getIdCategoriaDocumento(),
                entity.getTipoDocumento().getCategoriaDocumento().getNombre(),
                entity.getNumeroDocumento(),
                entity.getEstadoVerificacion(),
                entity.getEstado(),
                entity.getFechaCreacion(),
                entity.getFechaActualizacion()
        );
    }

    public String normalizarDocumento(String numeroDocumento) {
        return numeroDocumento.trim().toUpperCase(Locale.ROOT);
    }
}