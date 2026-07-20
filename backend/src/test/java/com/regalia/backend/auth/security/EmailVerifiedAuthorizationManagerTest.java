package com.regalia.backend.auth.security;

import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailVerifiedAuthorizationManagerTest {

    private static final String CORREO_VENDEDOR = "vendedor.demo@regalia.local";

    @Mock
    private UsuarioJpaRepository usuarioRepository;

    @InjectMocks
    private EmailVerifiedAuthorizationManager authorizationManager;

    private Authentication autenticacion;

    @BeforeEach
    void configurarAutenticacion() {
        autenticacion = new UsernamePasswordAuthenticationToken(
                CORREO_VENDEDOR,
                null,
                List.of()
        );
    }

    @Test
    void debeAutorizarCuandoElCorreoEstaVerificado() {
        when(usuarioRepository.findByCorreoIgnoreCaseAndEstadoTrue(CORREO_VENDEDOR))
                .thenReturn(Optional.of(usuarioConCorreoVerificado(true)));

        AuthorizationDecision decision = authorizationManager.check(() -> autenticacion, null);

        assertThat(decision).isNotNull();
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    void debeDenegarCuandoElCorreoNoEstaVerificado() {
        when(usuarioRepository.findByCorreoIgnoreCaseAndEstadoTrue(CORREO_VENDEDOR))
                .thenReturn(Optional.of(usuarioConCorreoVerificado(false)));

        AuthorizationDecision decision = authorizationManager.check(() -> autenticacion, null);

        assertThat(decision).isNotNull();
        assertThat(decision.isGranted()).isFalse();
    }

    @Test
    void debeDenegarSinAutenticacionValida() {
        Authentication noAutenticado = new UsernamePasswordAuthenticationToken(
                CORREO_VENDEDOR,
                null
        );

        AuthorizationDecision decision = authorizationManager.check(() -> noAutenticado, null);

        assertThat(decision).isNotNull();
        assertThat(decision.isGranted()).isFalse();
        verifyNoInteractions(usuarioRepository);
    }

    private UsuarioEntity usuarioConCorreoVerificado(boolean correoVerificado) {
        UsuarioEntity usuario = new UsuarioEntity();
        usuario.setCorreo(CORREO_VENDEDOR);
        usuario.setCorreoVerificado(correoVerificado);
        usuario.setEstado(true);
        return usuario;
    }
}
