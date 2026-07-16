package com.regalia.backend.auth.security;

import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.Component;

import java.util.function.Supplier;

/**
 * Autoriza operaciones sensibles solo cuando el correo de la cuenta publica
 * esta confirmado. Consulta la base de datos para no depender de un JWT
 * emitido antes de la verificacion.
 */
@Component
@RequiredArgsConstructor
public class EmailVerifiedAuthorizationManager implements AuthorizationManager<RequestAuthorizationContext> {

    private final UsuarioJpaRepository usuarioRepository;

    @Override
    public AuthorizationDecision check(
            Supplier<Authentication> authenticationSupplier,
            RequestAuthorizationContext context
    ) {
        Authentication authentication = authenticationSupplier.get();

        if (authentication == null || !authentication.isAuthenticated()) {
            return new AuthorizationDecision(false);
        }

        boolean verificado = usuarioRepository
                .findByCorreoIgnoreCaseAndEstadoTrue(authentication.getName())
                .map(usuario -> Boolean.TRUE.equals(usuario.getCorreoVerificado()))
                .orElse(false);

        return new AuthorizationDecision(verificado);
    }
}
