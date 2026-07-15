package com.regalia.backend.usuario.infrastructure.mapper;

import com.regalia.backend.usuario.api.dto.UsuarioActualizarRequest;
import com.regalia.backend.usuario.api.dto.UsuarioRequest;
import com.regalia.backend.usuario.api.dto.UsuarioResponse;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;

import org.springframework.stereotype.Component;

/**
 * Mapper encargado de convertir entre DTOs y la entidad UsuarioEntity.
 */
@Component
public class UsuarioMapper {

    public UsuarioEntity toEntity(UsuarioRequest request, String contrasenaHash) {
        UsuarioEntity entity = new UsuarioEntity();

        entity.setNombre(limpiarTexto(request.nombres()));
        entity.setApellido(limpiarTexto(request.apellidos()));
        entity.setCorreo(limpiarTexto(request.correo()).toLowerCase());
        entity.setTelefono(limpiarTextoOpcional(request.telefono()));
        entity.setContrasenaHash(contrasenaHash);
        entity.setCorreoVerificado(false);
        entity.setEstado(true);

        return entity;
    }

    public UsuarioResponse toResponse(UsuarioEntity entity) {
        return new UsuarioResponse(
                entity.getIdUsuario(),
                entity.getNombre(),
                entity.getApellido(),
                entity.getCorreo(),
                entity.getTelefono(),
                entity.getCorreoVerificado(),
                entity.getEstado(),
                entity.getFechaCreacion(),
                entity.getFechaActualizacion()
        );
    }

    public void updateEntity(UsuarioEntity entity, UsuarioActualizarRequest request) {
        entity.setNombre(limpiarTexto(request.nombres()));
        entity.setApellido(limpiarTexto(request.apellidos()));
        entity.setTelefono(limpiarTextoOpcional(request.telefono()));
    }

    private String limpiarTexto(String texto) {
        return texto.trim();
    }

    private String limpiarTextoOpcional(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }
}
