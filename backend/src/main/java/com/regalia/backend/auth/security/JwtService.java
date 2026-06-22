package com.regalia.backend.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;

/**
 * Servicio encargado de generar, leer y validar tokens JWT.
 */
@Service
public class JwtService {

    private static final String CLAIM_ID_USUARIO = "idUsuario";
    private static final String CLAIM_ROLES = "roles";
    private static final String CLAIM_AUTH_CONTEXT = "authContext";

    @Value("${regalia.security.jwt.secret}")
    private String secret;

    @Value("${regalia.security.jwt.expiration-minutes}")
    private Long expirationMinutes;

    /**
     * Genera un token JWT con datos mínimos del usuario autenticado.
     */
    public String generarToken(
            Long idUsuario,
            String correo,
            List<String> roles,
            AuthContext authContext
    ) {
        Date fechaActual = new Date();
        Date fechaExpiracion = new Date(fechaActual.getTime() + expirationMinutes * 60 * 1000);

        return Jwts.builder()
                .subject(correo)
                .claim(CLAIM_ID_USUARIO, idUsuario)
                .claim(CLAIM_ROLES, roles)
                .claim(CLAIM_AUTH_CONTEXT, authContext.name())
                .issuedAt(fechaActual)
                .expiration(fechaExpiracion)
                .signWith(obtenerClaveFirma())
                .compact();
    }

    /**
     * Obtiene el correo almacenado como subject dentro del token.
     */
    public String obtenerCorreo(String token) {
        return obtenerClaims(token).getSubject();
    }

    /**
     * Obtiene los roles almacenados dentro del token.
     */
    public List<String> obtenerRoles(String token) {
        Object roles = obtenerClaims(token).get(CLAIM_ROLES);

        if (roles instanceof List<?>) {
            return ((List<?>) roles)
                    .stream()
                    .map(String::valueOf)
                    .toList();
        }

        return List.of();
    }

    /**
     * Obtiene el contexto de autenticación del token.
     */
    public AuthContext obtenerAuthContext(String token) {
        return obtenerAuthContext(obtenerClaims(token));
    }

    /**
     * Valida que el token sea legible, firmado correctamente, no esté expirado
     * y pertenezca a un contexto de autenticación conocido.
     */
    public boolean esTokenValido(String token) {
        try {
            Claims claims = obtenerClaims(token);

            return claims.getExpiration().after(new Date())
                    && obtenerAuthContext(claims) != null;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    public Long obtenerExpirationMinutes() {
        return expirationMinutes;
    }

    private Claims obtenerClaims(String token) {
        return Jwts.parser()
                .verifyWith(obtenerClaveFirma())
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

    private SecretKey obtenerClaveFirma() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
