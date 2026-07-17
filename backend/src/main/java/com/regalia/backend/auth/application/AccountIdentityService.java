package com.regalia.backend.auth.application;

import com.regalia.backend.auth.application.oauth.GoogleUserIdentity;
import com.regalia.backend.auth.application.result.AccountIdentityResult;
import com.regalia.backend.auth.application.result.GoogleIdentityLinkResult;
import com.regalia.backend.shared.exception.CredencialesInvalidasException;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
import com.regalia.backend.usuarioidentidad.infrastructure.entity.UsuarioIdentidadEntity;
import com.regalia.backend.usuarioidentidad.infrastructure.repository.UsuarioIdentidadJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

/**
 * Gestiona identidades externas de una cuenta ya autenticada.
 */
@Service
@RequiredArgsConstructor
public class AccountIdentityService {

    private static final String PROVEEDOR_GOOGLE = "GOOGLE";
    private static final String MENSAJE_CREDENCIALES_INVALIDAS = "Credenciales invalidas";

    private final GoogleSsoService googleSsoService;
    private final UsuarioJpaRepository usuarioRepository;
    private final UsuarioIdentidadJpaRepository usuarioIdentidadRepository;

    @Transactional(readOnly = true)
    public List<AccountIdentityResult> listarIdentidades(String correoAutenticado) {
        UsuarioEntity usuario = obtenerUsuarioAutenticado(correoAutenticado);

        return usuarioIdentidadRepository
                .findByUsuario_IdUsuarioAndEstadoTrueOrderByFechaCreacionDesc(usuario.getIdUsuario())
                .stream()
                .map(this::mapearIdentidad)
                .toList();
    }

    @Transactional
    public GoogleIdentityLinkResult vincularGoogle(String correoAutenticado, String idToken) {
        UsuarioEntity usuario = obtenerUsuarioAutenticado(correoAutenticado);
        GoogleUserIdentity googleIdentity = googleSsoService.verificarIdentidad(idToken);
        String correoGoogle = normalizarCorreo(googleIdentity.email());

        validarCorreoGoogleVerificado(googleIdentity);
        validarMismoCorreo(usuario, correoGoogle);

        googleSsoService.vincularUsuarioExistente(usuario, googleIdentity, correoGoogle);

        return new GoogleIdentityLinkResult(PROVEEDOR_GOOGLE, correoGoogle, true);
    }

    private UsuarioEntity obtenerUsuarioAutenticado(String correoAutenticado) {
        return usuarioRepository.findByCorreoIgnoreCaseAndEstadoTrue(correoAutenticado)
                .orElseThrow(() -> new CredencialesInvalidasException(MENSAJE_CREDENCIALES_INVALIDAS));
    }

    private void validarCorreoGoogleVerificado(GoogleUserIdentity googleIdentity) {
        if (!googleIdentity.emailVerified()) {
            throw new ReglaNegocioException("Google no confirmo el correo de esta cuenta");
        }
    }

    private void validarMismoCorreo(UsuarioEntity usuario, String correoGoogle) {
        String correoUsuario = normalizarCorreo(usuario.getCorreo());

        if (!correoUsuario.equals(correoGoogle)) {
            throw new ReglaNegocioException("La cuenta de Google debe usar el mismo correo de REGALIA");
        }
    }

    private String normalizarCorreo(String correo) {
        if (correo == null || correo.isBlank()) {
            throw new CredencialesInvalidasException(MENSAJE_CREDENCIALES_INVALIDAS);
        }

        return correo.trim().toLowerCase(Locale.ROOT);
    }

    private AccountIdentityResult mapearIdentidad(UsuarioIdentidadEntity identidad) {
        return new AccountIdentityResult(
                identidad.getProveedor(),
                identidad.getCorreoProveedor(),
                Boolean.TRUE.equals(identidad.getCorreoVerificado()),
                Boolean.TRUE.equals(identidad.getEstado()),
                identidad.getFechaCreacion()
        );
    }
}
