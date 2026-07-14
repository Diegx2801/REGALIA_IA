package com.regalia.backend.auth.application;

import com.regalia.backend.auditoria.application.AuditoriaEventoService;
import com.regalia.backend.auth.application.command.GoogleLoginCommand;
import com.regalia.backend.auth.application.command.LoginCommand;
import com.regalia.backend.auth.application.oauth.GoogleIdTokenVerifier;
import com.regalia.backend.auth.application.oauth.GoogleUserIdentity;
import com.regalia.backend.auth.application.result.LoginResult;
import com.regalia.backend.auth.security.AuthContext;
import com.regalia.backend.auth.security.JwtService;
import com.regalia.backend.rol.application.RolService;
import com.regalia.backend.rol.infrastructure.entity.RolEntity;
import com.regalia.backend.shared.exception.CredencialesInvalidasException;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
import com.regalia.backend.usuarioidentidad.infrastructure.entity.UsuarioIdentidadEntity;
import com.regalia.backend.usuarioidentidad.infrastructure.repository.UsuarioIdentidadJpaRepository;
import com.regalia.backend.usuariorol.infrastructure.entity.UsuarioRolEntity;
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
    private static final String PROVEEDOR_GOOGLE = "GOOGLE";
    private static final String NOMBRE_GOOGLE_FALLBACK = "Usuario";
    private static final String APELLIDO_GOOGLE_FALLBACK = "Google";
    private static final int MAX_NOMBRE_LENGTH = 100;
    private static final String MENSAJE_CREDENCIALES_INVALIDAS = "Credenciales inválidas";

    private final UsuarioJpaRepository usuarioRepository;
    private final UsuarioIdentidadJpaRepository usuarioIdentidadRepository;
    private final UsuarioRolJpaRepository usuarioRolRepository;
    private final RolService rolService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleIdTokenVerifier googleIdTokenVerifier;
    private final LoginAttemptLimiter loginAttemptLimiter;
    private final AuditoriaEventoService auditoriaEventoService;

    @Transactional(readOnly = true)
    public LoginResult loginPublico(LoginCommand request) {
        return loginPublico(request, "unknown", null);
    }

    @Transactional(readOnly = true)
    public LoginResult loginPublico(LoginCommand request, String ipCliente) {
        return loginPublico(request, ipCliente, null);
    }

    @Transactional(readOnly = true)
    public LoginResult loginPublico(LoginCommand request, String ipCliente, String userAgent) {
        return login(request, ipCliente, userAgent, AuthContext.PUBLIC);
    }

    @Transactional(readOnly = true)
    public LoginResult loginAdmin(LoginCommand request) {
        return loginAdmin(request, "unknown", null);
    }

    @Transactional(readOnly = true)
    public LoginResult loginAdmin(LoginCommand request, String ipCliente) {
        return loginAdmin(request, ipCliente, null);
    }

    @Transactional(readOnly = true)
    public LoginResult loginAdmin(LoginCommand request, String ipCliente, String userAgent) {
        return login(request, ipCliente, userAgent, AuthContext.ADMIN);
    }

    @Transactional
    public LoginResult loginGoogle(GoogleLoginCommand request, String ipCliente, String userAgent) {
        GoogleUserIdentity googleIdentity = googleIdTokenVerifier.verify(request.idToken());
        String correoNormalizado = normalizarCorreo(googleIdentity.email());

        loginAttemptLimiter.validarPermitido(AuthContext.PUBLIC, correoNormalizado, ipCliente);

        UsuarioEntity usuario = null;

        try {
            usuario = obtenerOCrearUsuarioGoogle(googleIdentity, correoNormalizado);
            List<String> roles = obtenerRolesActivos(usuario.getIdUsuario());
            validarAccesoPublico(roles);

            loginAttemptLimiter.registrarExito(AuthContext.PUBLIC, correoNormalizado, ipCliente);
            auditoriaEventoService.registrarLoginExitoso(
                    AuthContext.PUBLIC,
                    usuario.getIdUsuario(),
                    correoNormalizado,
                    ipCliente,
                    userAgent
            );

            return construirLoginResult(usuario, roles, AuthContext.PUBLIC);
        } catch (CredencialesInvalidasException ex) {
            boolean bloqueoAplicado = loginAttemptLimiter.registrarFallo(
                    AuthContext.PUBLIC,
                    correoNormalizado,
                    ipCliente
            );
            auditarLoginFallido(
                    AuthContext.PUBLIC,
                    usuario,
                    correoNormalizado,
                    ipCliente,
                    userAgent,
                    bloqueoAplicado
            );
            throw ex;
        }
    }

    private LoginResult login(
            LoginCommand request,
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

            return construirLoginResult(usuario, roles, authContext);
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
        if (
                usuario == null
                        || usuario.getContrasenaHash() == null
                        || !passwordEncoder.matches(contrasena, usuario.getContrasenaHash())
        ) {
            throw new CredencialesInvalidasException(MENSAJE_CREDENCIALES_INVALIDAS);
        }
    }

    private UsuarioEntity obtenerOCrearUsuarioGoogle(GoogleUserIdentity googleIdentity, String correoNormalizado) {
        return usuarioIdentidadRepository
                .findByProveedorAndProveedorSubjectAndEstadoTrue(PROVEEDOR_GOOGLE, googleIdentity.subject())
                .map(UsuarioIdentidadEntity::getUsuario)
                .map(this::validarUsuarioActivo)
                .orElseGet(() -> vincularOCrearUsuarioGoogle(googleIdentity, correoNormalizado));
    }

    private UsuarioEntity validarUsuarioActivo(UsuarioEntity usuario) {
        if (usuario == null || !Boolean.TRUE.equals(usuario.getEstado())) {
            throw new CredencialesInvalidasException(MENSAJE_CREDENCIALES_INVALIDAS);
        }

        return usuario;
    }

    private UsuarioEntity vincularOCrearUsuarioGoogle(GoogleUserIdentity googleIdentity, String correoNormalizado) {
        UsuarioEntity usuario = usuarioRepository
                .findByCorreoIgnoreCaseAndEstadoTrue(correoNormalizado)
                .orElseGet(() -> crearUsuarioGoogle(googleIdentity, correoNormalizado));

        vincularIdentidadGoogle(usuario, googleIdentity, correoNormalizado);

        return usuario;
    }

    private UsuarioEntity crearUsuarioGoogle(GoogleUserIdentity googleIdentity, String correoNormalizado) {
        UsuarioEntity usuario = new UsuarioEntity();
        usuario.setNombre(obtenerNombreGoogle(googleIdentity));
        usuario.setApellido(obtenerApellidoGoogle(googleIdentity));
        usuario.setCorreo(correoNormalizado);
        usuario.setContrasenaHash(null);
        usuario.setEstado(true);

        UsuarioEntity usuarioGuardado = usuarioRepository.saveAndFlush(usuario);
        asignarRolCliente(usuarioGuardado);

        return usuarioGuardado;
    }

    private void asignarRolCliente(UsuarioEntity usuario) {
        RolEntity rolCliente = rolService.obtenerEntidadActivaPorNombre(ROL_CLIENTE);

        if (!usuarioRolRepository.existsByUsuarioIdUsuarioAndRolIdRolAndEstadoTrue(
                usuario.getIdUsuario(),
                rolCliente.getIdRol()
        )) {
            usuarioRolRepository.save(new UsuarioRolEntity(usuario, rolCliente));
        }
    }

    private void vincularIdentidadGoogle(
            UsuarioEntity usuario,
            GoogleUserIdentity googleIdentity,
            String correoNormalizado
    ) {
        boolean yaTieneGoogle = usuarioIdentidadRepository.existsByUsuario_IdUsuarioAndProveedorAndEstadoTrue(
                usuario.getIdUsuario(),
                PROVEEDOR_GOOGLE
        );

        if (yaTieneGoogle) {
            throw new CredencialesInvalidasException(MENSAJE_CREDENCIALES_INVALIDAS);
        }

        UsuarioIdentidadEntity identidad = new UsuarioIdentidadEntity();
        identidad.setUsuario(usuario);
        identidad.setProveedor(PROVEEDOR_GOOGLE);
        identidad.setProveedorSubject(googleIdentity.subject());
        identidad.setCorreoProveedor(correoNormalizado);
        identidad.setCorreoVerificado(googleIdentity.emailVerified());
        identidad.setEstado(true);

        usuarioIdentidadRepository.save(identidad);
    }

    private String obtenerNombreGoogle(GoogleUserIdentity googleIdentity) {
        return normalizarTextoPerfil(
                primerTextoDisponible(googleIdentity.givenName(), googleIdentity.fullName()),
                NOMBRE_GOOGLE_FALLBACK
        );
    }

    private String obtenerApellidoGoogle(GoogleUserIdentity googleIdentity) {
        return normalizarTextoPerfil(googleIdentity.familyName(), APELLIDO_GOOGLE_FALLBACK);
    }

    private String primerTextoDisponible(String primero, String segundo) {
        if (primero != null && !primero.isBlank()) {
            return primero;
        }

        return segundo;
    }

    private String normalizarTextoPerfil(String valor, String fallback) {
        String texto = valor == null || valor.isBlank() ? fallback : valor.trim();

        if (texto.length() <= MAX_NOMBRE_LENGTH) {
            return texto;
        }

        return texto.substring(0, MAX_NOMBRE_LENGTH);
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

    private LoginResult construirLoginResult(
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

        return new LoginResult(
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
