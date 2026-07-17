package com.regalia.backend.auth.security;

import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Punto unico de validacion del estado vigente de las credenciales. Su fuente
 * actual es PostgreSQL; puede decorarse con cache sin modificar el filtro JWT.
 */
@Service
@RequiredArgsConstructor
public class EstadoAutenticacionService {

    private final UsuarioJpaRepository usuarioRepository;

    public boolean correspondeAVersionVigente(Long idUsuario, Integer versionToken) {
        if (idUsuario == null || versionToken == null) {
            return false;
        }

        return usuarioRepository.findEstadoAutenticacionByIdUsuario(idUsuario)
                .map(estado -> Boolean.TRUE.equals(estado.getEstado())
                        && versionToken.equals(estado.getVersionAutenticacion()))
                .orElse(false);
    }
}
