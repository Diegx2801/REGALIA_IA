package com.regalia.backend.auth.application;

import com.regalia.backend.auditoria.application.AuditoriaEventoService;
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
import java.util.Locale;

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
    private final LoginAttemptLimiter loginAttemptLimiter;
    private final AuditoriaEventoService auditoriaEventoService;

    @Transactional(readOnly = true)
    public LoginResponse loginPublico(LoginRequest request) {
        return loginPublico(request, "unknown", null);
    }

    @Transactional(readOnly = true)
    public LoginResponse loginPublico(LoginRequest request, String ipCliente) {
        return loginPublico(request, ipCliente, null);
    }

    @Transactional(readOnly = true)
    public LoginResponse loginPublico(LoginRequest request, String ipCliente, String userAgent) {
        return login(request, ipCliente, userAgent, AuthContext.PUBLIC);
    }

    @Transactional(readOnly = true)
    public LoginResponse loginAdmin(LoginRequest request) {
        return loginAdmin(request, "unknown", null);
    }

    @Transactional(readOnly = true)
    public LoginResponse loginAdmin(LoginRequest request, String ipCliente) {
        return loginAdmin(request, ipCliente, null);
    }

    @Transactional(readOnly = true)
    public LoginResponse loginAdmin(LoginRequest request, String ipCliente, String userAgent) {
        return login(request, ipCliente, userAgent, AuthContext.ADMIN);
    }

    private LoginResponse login(
            LoginRequest request,
            String ipCliente,
            String userAgent,
            AuthContext authContext
    ) {
        String correoNormalizado = normalizarCorreo(request.correo());

        loginAttemptLimiter.validarPermitido(authContext, correoNormalizado, ipCliente);
        UsuarioEntity usuario = buscarUsuarioActivoPorCorreo(correoNormalizado);

        try {
            validarCredenciales(usuario, request.contrasena());
            List<String> roles = obtenerRolesActivos(usuario.getIdUsuario());

            if (AuthContext.ADMIN.equals(authContext)) {
                validarAccesoAdmin(roles);
            } else {
                validarAccesoPublico(roles);
            }

            loginAttemptLimiter.registrarExito(authContext, correoNormalizado, ipCliente);
            auditoriaEventoService.registrarLoginExitoso(
                    authContext,
                    usuario.getIdUsuario(),
                    correoNormalizado,
                    ipCliente,
                    userAgent
            );

            return construirLoginResponse(usuario, roles, authContext);
        } catch (CredencialesInvalidasException ex) {
            boolean bloqueoAplicado = loginAttemptLimiter.registrarFallo(
                    authContext,
                    correoNormalizado,
                    ipCliente
            );
            auditarLoginFallido(
                    authContext,
                    usuario,
                    correoNormalizado,
                    ipCliente,
                    userAgent,
                    bloqueoAplicado
            );
            throw ex;
        }
    }

    private UsuarioEntity buscarUsuarioActivoPorCorreo(String correoNormalizado) {
        return usuarioRepository.findByCorreoIgnoreCaseAndEstadoTrue(correoNormalizado)
                .orElse(null);
    }

    private void validarCredenciales(UsuarioEntity usuario, String contrasena) {
        if (usuario == null || !passwordEncoder.matches(contrasena, usuario.getContrasenaHash())) {
            throw new CredencialesInvalidasException(MENSAJE_CREDENCIALES_INVALIDAS);
        }
    }

    private void auditarLoginFallido(
            AuthContext authContext,
            UsuarioEntity usuario,
            String correoNormalizado,
            String ipCliente,
            String userAgent,
            boolean bloqueoAplicado
    ) {
        Long idUsuarioActor = usuario == null ? null : usuario.getIdUsuario();

        if (bloqueoAplicado) {
            auditoriaEventoService.registrarLoginLimitado(
                    authContext,
                    idUsuarioActor,
                    correoNormalizado,
                    ipCliente,
                    userAgent
            );
            return;
        }

        if (AuthContext.ADMIN.equals(authContext)) {
            auditoriaEventoService.registrarLoginAdminFallido(
                    idUsuarioActor,
                    correoNormalizado,
                    ipCliente,
                    userAgent
            );
        }
    }

    private String normalizarCorreo(String correo) {
        return correo.trim().toLowerCase(Locale.ROOT);
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
                jwtService.obtenerExpirationMinutes(authContext)
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
