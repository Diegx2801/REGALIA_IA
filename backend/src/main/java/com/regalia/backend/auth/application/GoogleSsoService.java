package com.regalia.backend.auth.application;

import com.regalia.backend.auth.application.oauth.GoogleIdTokenVerifier;
import com.regalia.backend.auth.application.oauth.GoogleUserIdentity;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Encapsula las reglas de autenticacion SSO con Google sin mezclar el login local.
 */
@Service
@RequiredArgsConstructor
public class GoogleSsoService {

    private static final String PROVEEDOR_GOOGLE = "GOOGLE";
    private static final String ROL_CLIENTE = "CLIENTE";
    private static final String NOMBRE_GOOGLE_FALLBACK = "Usuario";
    private static final String APELLIDO_GOOGLE_FALLBACK = "Google";
    private static final int MAX_NOMBRE_LENGTH = 100;
    private static final String MENSAJE_CREDENCIALES_INVALIDAS = "Credenciales invalidas";

    private final GoogleIdTokenVerifier googleIdTokenVerifier;
    private final UsuarioJpaRepository usuarioRepository;
    private final UsuarioIdentidadJpaRepository usuarioIdentidadRepository;
    private final UsuarioRolJpaRepository usuarioRolRepository;
    private final RolService rolService;

    public GoogleUserIdentity verificarIdentidad(String idToken) {
        return googleIdTokenVerifier.verify(idToken);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public UsuarioEntity obtenerOCrearUsuario(GoogleUserIdentity googleIdentity, String correoNormalizado) {
        return usuarioIdentidadRepository
                .findByProveedorAndProveedorSubjectAndEstadoTrue(PROVEEDOR_GOOGLE, googleIdentity.subject())
                .map(UsuarioIdentidadEntity::getUsuario)
                .map(this::validarUsuarioActivo)
                .orElseGet(() -> vincularOCrearUsuario(googleIdentity, correoNormalizado));
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void vincularUsuarioExistente(
            UsuarioEntity usuario,
            GoogleUserIdentity googleIdentity,
            String correoNormalizado
    ) {
        validarUsuarioActivo(usuario);
        validarSubjectDisponible(usuario, googleIdentity);
        vincularIdentidadGoogle(usuario, googleIdentity, correoNormalizado);
    }

    private UsuarioEntity validarUsuarioActivo(UsuarioEntity usuario) {
        if (usuario == null || !Boolean.TRUE.equals(usuario.getEstado())) {
            throw new CredencialesInvalidasException(MENSAJE_CREDENCIALES_INVALIDAS);
        }

        return usuario;
    }

    private void validarSubjectDisponible(UsuarioEntity usuario, GoogleUserIdentity googleIdentity) {
        usuarioIdentidadRepository
                .findByProveedorAndProveedorSubjectAndEstadoTrue(PROVEEDOR_GOOGLE, googleIdentity.subject())
                .ifPresent(identidad -> {
                    Long idUsuarioVinculado = identidad.getUsuario().getIdUsuario();

                    if (!idUsuarioVinculado.equals(usuario.getIdUsuario())) {
                        throw new CredencialesInvalidasException(MENSAJE_CREDENCIALES_INVALIDAS);
                    }
                });
    }

    private UsuarioEntity vincularOCrearUsuario(GoogleUserIdentity googleIdentity, String correoNormalizado) {
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
}
