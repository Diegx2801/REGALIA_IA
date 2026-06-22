package com.regalia.backend.auth.application;

import com.regalia.backend.auth.api.dto.LoginRequest;
import com.regalia.backend.auth.api.dto.LoginResponse;
import com.regalia.backend.auth.security.AuthContext;
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
    private static final String ROL_ADMIN = "ADMIN";
    private static final String ROL_CLIENTE = "CLIENTE";
    private static final String ROL_VENDEDOR = "VENDEDOR";
    private static final String MENSAJE_CREDENCIALES_INVALIDAS = "Credenciales inválidas";

    private final UsuarioJpaRepository usuarioRepository;
    private final UsuarioRolJpaRepository usuarioRolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional(readOnly = true)
    public LoginResponse loginPublico(LoginRequest request) {
        UsuarioEntity usuario = autenticarCredenciales(request);
        List<String> roles = obtenerRolesActivos(usuario.getIdUsuario());

        validarAccesoPublico(roles);

        return construirLoginResponse(usuario, roles, AuthContext.PUBLIC);
    }

    @Transactional(readOnly = true)
    public LoginResponse loginAdmin(LoginRequest request) {
        UsuarioEntity usuario = autenticarCredenciales(request);
        List<String> roles = obtenerRolesActivos(usuario.getIdUsuario());

        validarAccesoAdmin(roles);

        return construirLoginResponse(usuario, roles, AuthContext.ADMIN);
    }

    private UsuarioEntity autenticarCredenciales(LoginRequest request) {
        String correoNormalizado = request.correo().trim().toLowerCase();

        UsuarioEntity usuario = usuarioRepository.findByCorreoIgnoreCaseAndEstadoTrue(correoNormalizado)
                .orElseThrow(() -> new CredencialesInvalidasException(MENSAJE_CREDENCIALES_INVALIDAS));

        if (!passwordEncoder.matches(request.contrasena(), usuario.getContrasenaHash())) {
            throw new CredencialesInvalidasException(MENSAJE_CREDENCIALES_INVALIDAS);
        }

        return usuario;
    }

    private LoginResponse construirLoginResponse(
            UsuarioEntity usuario,
            List<String> roles,
            AuthContext authContext
    ) {
        String token = jwtService.generarToken(
                usuario.getIdUsuario(),
                usuario.getCorreo(),
                roles,
                authContext
        );

        return new LoginResponse(
                token,
                TIPO_TOKEN,
                usuario.getIdUsuario(),
                usuario.getCorreo(),
                roles,
                authContext.name(),
                jwtService.obtenerExpirationMinutes()
        );
    }

    private void validarAccesoPublico(List<String> roles) {
        if (contieneRol(roles, ROL_ADMIN)) {
            throw new CredencialesInvalidasException(MENSAJE_CREDENCIALES_INVALIDAS);
        }

        boolean tieneRolPublico = contieneRol(roles, ROL_CLIENTE) || contieneRol(roles, ROL_VENDEDOR);

        if (!tieneRolPublico) {
            throw new CredencialesInvalidasException(MENSAJE_CREDENCIALES_INVALIDAS);
        }
    }

    private void validarAccesoAdmin(List<String> roles) {
        boolean soloTieneRolAdmin = roles.size() == 1 && contieneRol(roles, ROL_ADMIN);

        if (!soloTieneRolAdmin) {
            throw new CredencialesInvalidasException(MENSAJE_CREDENCIALES_INVALIDAS);
        }
    }

    private boolean contieneRol(List<String> roles, String rolEsperado) {
        return roles.stream()
                .anyMatch(rol -> rolEsperado.equalsIgnoreCase(rol));
    }

    private List<String> obtenerRolesActivos(Long idUsuario) {
        return usuarioRolRepository.findByUsuarioIdUsuarioAndEstadoTrue(idUsuario)
                .stream()
                .map(usuarioRol -> usuarioRol.getRol().getNombre())
                .toList();
    }
}
