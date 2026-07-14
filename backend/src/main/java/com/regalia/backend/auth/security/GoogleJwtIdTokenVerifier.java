package com.regalia.backend.auth.security;

import com.regalia.backend.auth.application.oauth.GoogleIdTokenVerifier;
import com.regalia.backend.auth.application.oauth.GoogleUserIdentity;
import com.regalia.backend.shared.exception.CredencialesInvalidasException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Objects;

/**
 * Valida ID tokens de Google usando el issuer OIDC y el Client ID configurado.
 */
@Service
@RequiredArgsConstructor
public class GoogleJwtIdTokenVerifier implements GoogleIdTokenVerifier {

    private static final String CLAIM_EMAIL = "email";
    private static final String CLAIM_EMAIL_VERIFIED = "email_verified";
    private static final String CLAIM_GIVEN_NAME = "given_name";
    private static final String CLAIM_FAMILY_NAME = "family_name";
    private static final String CLAIM_NAME = "name";
    private static final String CLAIM_PICTURE = "picture";
    private static final String MENSAJE_TOKEN_INVALIDO = "No se pudo validar la identidad de Google";

    private final GoogleOAuthProperties googleOAuthProperties;
    private volatile JwtDecoder jwtDecoder;

    @Override
    public GoogleUserIdentity verify(String idToken) {
        try {
            Jwt jwt = obtenerJwtDecoder().decode(idToken);
            return construirIdentidad(jwt);
        } catch (JwtException | IllegalStateException ex) {
            throw new CredencialesInvalidasException(MENSAJE_TOKEN_INVALIDO);
        }
    }

    private JwtDecoder obtenerJwtDecoder() {
        if (jwtDecoder == null) {
            synchronized (this) {
                if (jwtDecoder == null) {
                    jwtDecoder = construirJwtDecoder();
                }
            }
        }

        return jwtDecoder;
    }

    private JwtDecoder construirJwtDecoder() {
        if (!googleOAuthProperties.isConfigured()) {
            throw new IllegalStateException("Google OAuth no esta configurado");
        }

        NimbusJwtDecoder decoder = NimbusJwtDecoder
                .withIssuerLocation(googleOAuthProperties.getIssuer())
                .build();

        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(googleOAuthProperties.getIssuer()),
                validarAudience()
        ));

        return decoder;
    }

    private OAuth2TokenValidator<Jwt> validarAudience() {
        return jwt -> {
            boolean tokenPerteneceARegalia = jwt.getAudience()
                    .stream()
                    .anyMatch(audience -> Objects.equals(audience, googleOAuthProperties.getClientId()));

            if (tokenPerteneceARegalia) {
                return OAuth2TokenValidatorResult.success();
            }

            OAuth2Error error = new OAuth2Error(
                    "invalid_token",
                    "El ID token de Google no pertenece a REGALIA",
                    null
            );

            return OAuth2TokenValidatorResult.failure(error);
        };
    }

    private GoogleUserIdentity construirIdentidad(Jwt jwt) {
        String subject = jwt.getSubject();
        String email = jwt.getClaimAsString(CLAIM_EMAIL);
        boolean emailVerified = Boolean.TRUE.equals(jwt.getClaimAsBoolean(CLAIM_EMAIL_VERIFIED));

        if (subject == null || subject.isBlank() || email == null || email.isBlank() || !emailVerified) {
            throw new CredencialesInvalidasException(MENSAJE_TOKEN_INVALIDO);
        }

        return new GoogleUserIdentity(
                subject,
                email.trim().toLowerCase(Locale.ROOT),
                true,
                jwt.getClaimAsString(CLAIM_GIVEN_NAME),
                jwt.getClaimAsString(CLAIM_FAMILY_NAME),
                jwt.getClaimAsString(CLAIM_NAME),
                jwt.getClaimAsString(CLAIM_PICTURE)
        );
    }
}
