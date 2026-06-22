package com.regalia.backend.auth.application;

import com.regalia.backend.auditoria.application.AuditoriaEventoService;
import com.regalia.backend.auth.api.dto.LoginRequest;
import com.regalia.backend.auth.api.dto.LoginResponse;
import com.regalia.backend.auth.security.AuthContext;
import com.regalia.backend.auth.security.JwtService;
import com.regalia.backend.rol.infrastructure.entity.RolEntity;
import com.regalia.backend.shared.exception.CredencialesInvalidasException;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
import com.regalia.backend.usuariorol.infrastructure.entity.UsuarioRolEntity;
import com.regalia.backend.usuariorol.infrastructure.repository.UsuarioRolJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String CORREO = "usuario@regalia.com";
    private static final String PASSWORD = "password-seguro";
    private static final String PASSWORD_HASH = "hash";

    @Mock
    private UsuarioJpaRepository usuarioRepository;

    @Mock
    private UsuarioRolJpaRepository usuarioRolRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private LoginAttemptLimiter loginAttemptLimiter;

    @Mock
    private AuditoriaEventoService auditoriaEventoService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                usuarioRepository,
                usuarioRolRepository,
                passwordEncoder,
                jwtService,
                loginAttemptLimiter,
                auditoriaEventoService
        );
    }

    @Test
    void loginPublicoEmiteTokenConContextoPublicoParaCliente() {
        UsuarioEntity usuario = usuario(CORREO);
        List<String> roles = List.of("CLIENTE");

        prepararCredencialesValidas(usuario);
        when(usuarioRolRepository.findByUsuarioIdUsuarioAndEstadoTrue(usuario.getIdUsuario()))
                .thenReturn(List.of(usuarioRol("CLIENTE")));
        when(jwtService.generarToken(usuario.getIdUsuario(), usuario.getCorreo(), roles, AuthContext.PUBLIC))
                .thenReturn("token-publico");
        when(jwtService.obtenerExpirationMinutes(AuthContext.PUBLIC)).thenReturn(240L);

        LoginResponse response = authService.loginPublico(new LoginRequest(CORREO, PASSWORD));

        assertThat(response.token()).isEqualTo("token-publico");
        assertThat(response.roles()).containsExactly("CLIENTE");
        assertThat(response.authContext()).isEqualTo(AuthContext.PUBLIC.name());
        assertThat(response.expiraEnMinutos()).isEqualTo(240L);
    }

    @Test
    void loginPublicoRechazaCuentaAdmin() {
        UsuarioEntity usuario = usuario(CORREO);

        prepararCredencialesValidas(usuario);
        when(usuarioRolRepository.findByUsuarioIdUsuarioAndEstadoTrue(usuario.getIdUsuario()))
                .thenReturn(List.of(usuarioRol("ADMIN")));

        assertThatThrownBy(() -> authService.loginPublico(new LoginRequest(CORREO, PASSWORD)))
                .isInstanceOf(CredencialesInvalidasException.class);

        verify(jwtService, never()).generarToken(
                usuario.getIdUsuario(),
                usuario.getCorreo(),
                List.of("ADMIN"),
                AuthContext.PUBLIC
        );
    }

    @Test
    void loginAdminEmiteTokenConContextoAdminParaAdminExclusivo() {
        UsuarioEntity usuario = usuario(CORREO);
        List<String> roles = List.of("ADMIN");

        prepararCredencialesValidas(usuario);
        when(usuarioRolRepository.findByUsuarioIdUsuarioAndEstadoTrue(usuario.getIdUsuario()))
                .thenReturn(List.of(usuarioRol("ADMIN")));
        when(jwtService.generarToken(usuario.getIdUsuario(), usuario.getCorreo(), roles, AuthContext.ADMIN))
                .thenReturn("token-admin");
        when(jwtService.obtenerExpirationMinutes(AuthContext.ADMIN)).thenReturn(30L);

        LoginResponse response = authService.loginAdmin(new LoginRequest(CORREO, PASSWORD));

        assertThat(response.token()).isEqualTo("token-admin");
        assertThat(response.roles()).containsExactly("ADMIN");
        assertThat(response.authContext()).isEqualTo(AuthContext.ADMIN.name());
        assertThat(response.expiraEnMinutos()).isEqualTo(30L);
    }

    @Test
    void loginAdminRechazaCuentaNoAdmin() {
        UsuarioEntity usuario = usuario(CORREO);

        prepararCredencialesValidas(usuario);
        when(usuarioRolRepository.findByUsuarioIdUsuarioAndEstadoTrue(usuario.getIdUsuario()))
                .thenReturn(List.of(usuarioRol("CLIENTE")));

        assertThatThrownBy(() -> authService.loginAdmin(new LoginRequest(CORREO, PASSWORD)))
                .isInstanceOf(CredencialesInvalidasException.class);

        verify(jwtService, never()).generarToken(
                usuario.getIdUsuario(),
                usuario.getCorreo(),
                List.of("CLIENTE"),
                AuthContext.ADMIN
        );
    }

    @Test
    void loginAdminRechazaCuentaAdminConRolesPublicos() {
        UsuarioEntity usuario = usuario(CORREO);

        prepararCredencialesValidas(usuario);
        when(usuarioRolRepository.findByUsuarioIdUsuarioAndEstadoTrue(usuario.getIdUsuario()))
                .thenReturn(List.of(usuarioRol("ADMIN"), usuarioRol("CLIENTE")));

        assertThatThrownBy(() -> authService.loginAdmin(new LoginRequest(CORREO, PASSWORD)))
                .isInstanceOf(CredencialesInvalidasException.class);

        verify(jwtService, never()).generarToken(
                usuario.getIdUsuario(),
                usuario.getCorreo(),
                List.of("ADMIN", "CLIENTE"),
                AuthContext.ADMIN
        );
    }

    private void prepararCredencialesValidas(UsuarioEntity usuario) {
        when(usuarioRepository.findByCorreoIgnoreCaseAndEstadoTrue(CORREO))
                .thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(true);
    }

    private UsuarioEntity usuario(String correo) {
        UsuarioEntity usuario = new UsuarioEntity();
        usuario.setIdUsuario(1L);
        usuario.setCorreo(correo);
        usuario.setContrasenaHash(PASSWORD_HASH);
        usuario.setEstado(true);

        return usuario;
    }

    private UsuarioRolEntity usuarioRol(String nombreRol) {
        RolEntity rol = new RolEntity();
        rol.setNombre(nombreRol);

        UsuarioRolEntity usuarioRol = new UsuarioRolEntity();
        usuarioRol.setRol(rol);

        return usuarioRol;
    }
}
