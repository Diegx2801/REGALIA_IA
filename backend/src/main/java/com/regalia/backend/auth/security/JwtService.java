package com.regalia.backend.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;
import java.util.Optional;

/**
 * Servicio encargado de generar, leer y validar tokens JWT.
 */
@Service
@RequiredArgsConstructor
public class JwtService {

    private static final String CLAIM_ID_USUARIO = "idUsuario";
    private static final String CLAIM_ROLES = "roles";
    private static final String CLAIM_AUTH_CONTEXT = "authContext";
    private static final String CLAIM_AUTH_VERSION = "authVersion";
    private static final String CLAIM_TOKEN_TYPE = "tokenType";
    private static final String TOKEN_TYPE_ACCESS = "ACCESS";

    private final JwtProperties jwtProperties;

    /**
     * Genera un token JWT con datos minimos del usuario autenticado.
     */
    public String generarToken(
            Long idUsuario,
            String correo,
            List<String> roles,
            AuthContext authContext,
            Integer versionAutenticacion
    ) {
        Date fechaActual = new Date();
        Long expirationMinutes = jwtProperties.obtenerExpirationMinutes(authContext);
        Date fechaExpiracion = new Date(fechaActual.getTime() + expirationMinutes * 60 * 1000);

        return Jwts.builder()
                .issuer(jwtProperties.getIssuer())
                .subject(correo)
                .audience()
                .single(jwtProperties.getAudience())
                .claim(CLAIM_ID_USUARIO, idUsuario)
                .claim(CLAIM_ROLES, roles)
                .claim(CLAIM_AUTH_CONTEXT, authContext.name())
                .claim(CLAIM_AUTH_VERSION, versionAutenticacion)
                .claim(CLAIM_TOKEN_TYPE, TOKEN_TYPE_ACCESS)
                .issuedAt(fechaActual)
                .expiration(fechaExpiracion)
                .signWith(obtenerClaveFirma())
                .compact();
    }

    /**
     * Valida firma, emisor, audiencia, expiracion y claims obligatorios.
     */
    public Optional<JwtAccessToken> extraerAccessTokenValido(String token) {
        try {
            Claims claims = obtenerClaims(token);
            Long idUsuario = claims.get(CLAIM_ID_USUARIO, Long.class);
            Integer versionAutenticacion = claims.get(CLAIM_AUTH_VERSION, Integer.class);
            AuthContext authContext = obtenerAuthContext(claims);
            List<String> roles = obtenerRoles(claims);

            boolean esValido = claims.getExpiration() != null
                    && claims.getExpiration().after(new Date())
                    && TOKEN_TYPE_ACCESS.equals(claims.get(CLAIM_TOKEN_TYPE, String.class))
                    && StringUtils.hasText(claims.getSubject())
                    && idUsuario != null
                    && versionAutenticacion != null
                    && !roles.isEmpty()
                    && authContext != null;

            if (!esValido) {
                return Optional.empty();
            }

            return Optional.of(new JwtAccessToken(
                    idUsuario,
                    claims.getSubject(),
                    roles,
                    authContext,
                    versionAutenticacion
            ));
        } catch (JwtException | IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    public Long obtenerExpirationMinutes(AuthContext authContext) {
        return jwtProperties.obtenerExpirationMinutes(authContext);
    }

    private Claims obtenerClaims(String token) {
        return Jwts.parser()
                .verifyWith(obtenerClaveFirma())
                .requireIssuer(jwtProperties.getIssuer())
                .requireAudience(jwtProperties.getAudience())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private AuthContext obtenerAuthContext(Claims claims) {
        Object authContext = claims.get(CLAIM_AUTH_CONTEXT);

        if (authContext == null) {
            return null;
        }

        try {
            return AuthContext.valueOf(String.valueOf(authContext));
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private List<String> obtenerRoles(Claims claims) {
        Object roles = claims.get(CLAIM_ROLES);

        if (roles instanceof List<?>) {
            return ((List<?>) roles)
                    .stream()
                    .map(String::valueOf)
                    .toList();
        }

        return List.of();
    }

    private SecretKey obtenerClaveFirma() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtProperties.getSecret());
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
