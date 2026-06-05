package com.regalia.backend.auth.application;

import com.regalia.backend.auth.api.dto.LoginRequest;
import com.regalia.backend.auth.api.dto.LoginResponse;
import com.regalia.backend.auth.security.JwtService;
import com.regalia.backend.shared.exception.CredencialesInvalidasException;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
import com.regalia.backend.usuariorol.infrastructure.repository.UsuarioRolJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio de aplicación para autenticar usuarios y emitir tokens JWT.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String TIPO_TOKEN = "Bearer";

    private final UsuarioJpaRepository usuarioRepository;
    private final UsuarioRolJpaRepository usuarioRolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String correoNormalizado = request.correo().trim().toLowerCase();

        UsuarioEntity usuario = usuarioRepository.findByCorreoIgnoreCaseAndEstadoTrue(correoNormalizado)
                .orElseThrow(() -> new CredencialesInvalidasException("Credenciales inválidas"));

        if (!passwordEncoder.matches(request.contrasena(), usuario.getContrasenaHash())) {
            throw new CredencialesInvalidasException("Credenciales inválidas");
        }

        List<String> roles = obtenerRolesActivos(usuario.getIdUsuario());

        String token = jwtService.generarToken(
                usuario.getIdUsuario(),
                usuario.getCorreo(),
                roles
        );

        return new LoginResponse(
                token,
                TIPO_TOKEN,
                usuario.getIdUsuario(),
                usuario.getCorreo(),
                roles,
                jwtService.obtenerExpirationMinutes()
        );
    }

    private List<String> obtenerRolesActivos(Long idUsuario) {
        return usuarioRolRepository.findByUsuarioIdUsuarioAndEstadoTrue(idUsuario)
                .stream()
                .map(usuarioRol -> usuarioRol.getRol().getNombre())
                .toList();
    }
}