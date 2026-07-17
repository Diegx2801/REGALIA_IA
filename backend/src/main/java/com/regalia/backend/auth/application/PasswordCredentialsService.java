package com.regalia.backend.auth.application;

import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Centraliza las mutaciones de contrasena y la invalidacion global de JWT
 * asociada a un cambio de credenciales.
 */
@Service
@RequiredArgsConstructor
public class PasswordCredentialsService {

    private final UsuarioJpaRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void cambiarContrasena(String correoAutenticado, String contrasenaActual, String nuevaContrasena) {
        UsuarioEntity usuario = usuarioRepository.findByCorreoIgnoreCaseAndEstadoTrueForUpdate(correoAutenticado)
                .orElseThrow(() -> new ReglaNegocioException("No se encontro una cuenta activa para cambiar la contrasena"));

        if (!StringUtils.hasText(usuario.getContrasenaHash())) {
            throw new ReglaNegocioException(
                    "Esta cuenta no tiene una contrasena local. Podras crearla desde la gestion de accesos"
            );
        }

        if (!passwordEncoder.matches(contrasenaActual, usuario.getContrasenaHash())) {
            throw new ReglaNegocioException("La contrasena actual no es correcta");
        }

        actualizarContrasenaYRevocarTokens(usuario, nuevaContrasena);
    }

    @Transactional
    public void restablecerContrasena(Long idUsuario, String nuevaContrasena) {
        UsuarioEntity usuario = usuarioRepository.findByIdForUpdate(idUsuario)
                .orElseThrow(() -> new ReglaNegocioException("No se pudo restablecer la contrasena de esta cuenta"));

        if (!Boolean.TRUE.equals(usuario.getEstado())) {
            throw new ReglaNegocioException("No se pudo restablecer la contrasena de esta cuenta");
        }

        actualizarContrasenaYRevocarTokens(usuario, nuevaContrasena);
    }

    private void actualizarContrasenaYRevocarTokens(UsuarioEntity usuario, String nuevaContrasena) {
        usuario.setContrasenaHash(passwordEncoder.encode(nuevaContrasena));
        usuario.setVersionAutenticacion(obtenerSiguienteVersion(usuario.getVersionAutenticacion()));
        usuarioRepository.save(usuario);
    }

    private int obtenerSiguienteVersion(Integer versionActual) {
        return versionActual == null ? 1 : Math.incrementExact(versionActual);
    }
}
