package com.regalia.backend.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Filtro que intercepta cada solicitud HTTP para validar el JWT enviado en Authorization.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String HEADER_AUTHORIZATION = "Authorization";
    private static final String PREFIX_BEARER = "Bearer ";

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String authorizationHeader = request.getHeader(HEADER_AUTHORIZATION);

        if (authorizationHeader == null || !authorizationHeader.startsWith(PREFIX_BEARER)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authorizationHeader.substring(PREFIX_BEARER.length());

        if (jwtService.esTokenValido(token) && SecurityContextHolder.getContext().getAuthentication() == null) {
            String correo = jwtService.obtenerCorreo(token);
            AuthContext authContext = jwtService.obtenerAuthContext(token);

            List<SimpleGrantedAuthority> authorities = jwtService.obtenerRoles(token)
                    .stream()
                    .map(rol -> new SimpleGrantedAuthority("ROLE_" + rol))
                    .toList();

            List<SimpleGrantedAuthority> authoritiesConContexto = new ArrayList<>(authorities);
            authoritiesConContexto.add(new SimpleGrantedAuthority("AUTH_CONTEXT_" + authContext.name()));

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    correo,
                    null,
                    authoritiesConContexto
            );

            authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }
}
