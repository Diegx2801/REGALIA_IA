package com.regalia.backend.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.regalia.backend.shared.config.SecurityHeadersProperties;
import com.regalia.backend.shared.response.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.util.StringUtils;

import java.util.Arrays;

/**
 * Configuración principal de seguridad para la API REST.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String ROLE_ADMIN = "ROLE_ADMIN";
    private static final String ROLE_CLIENTE = "ROLE_CLIENTE";
    private static final String ROLE_VENDEDOR = "ROLE_VENDEDOR";
    private static final String AUTH_CONTEXT_ADMIN = "AUTH_CONTEXT_ADMIN";
    private static final String AUTH_CONTEXT_PUBLIC = "AUTH_CONTEXT_PUBLIC";

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper;
    private final SecurityHeadersProperties securityHeadersProperties;
    private final EmailVerifiedAuthorizationManager emailVerifiedAuthorizationManager;

    @Bean
    // SECURITY FILTER CHAIN: define el flujo de seguridad que se ejecuta en cada request.
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())

                .cors(cors -> {})

                .headers(headers -> {
                    if (StringUtils.hasText(securityHeadersProperties.getReferrerPolicy())) {
                        headers.addHeaderWriter(new StaticHeadersWriter(
                                "Referrer-Policy",
                                securityHeadersProperties.getReferrerPolicy()
                        ));
                    }

                    if (StringUtils.hasText(securityHeadersProperties.getPermissionsPolicy())) {
                        headers.addHeaderWriter(new StaticHeadersWriter(
                                "Permissions-Policy",
                                securityHeadersProperties.getPermissionsPolicy()
                        ));
                    }

                    if (securityHeadersProperties.isHstsEnabled()) {
                        headers.httpStrictTransportSecurity(hsts -> hsts
                                .maxAgeInSeconds(securityHeadersProperties.getHstsMaxAgeSeconds())
                                .includeSubDomains(securityHeadersProperties.isHstsIncludeSubdomains())
                        );
                    } else {
                        headers.httpStrictTransportSecurity(hsts -> hsts.disable());
                    }
                })

                // JWT: la API es stateless; cada request se valida con token y no con sesion servidor.
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .exceptionHandling(exception -> exception

                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

                            ApiResponse<Void> apiResponse = ApiResponse.error("No autorizado");

                            objectMapper.writeValue(response.getOutputStream(), apiResponse);
                        })

                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

                            ApiResponse<Void> apiResponse = ApiResponse.error("Acceso denegado");

                            objectMapper.writeValue(response.getOutputStream(), apiResponse);
                        })
                )

                .authorizeHttpRequests(auth -> auth

                        /*
                         * Autenticación:
                         * El login público no emite tokens administrativos.
                         * El login administrativo solo acepta cuentas con rol ADMIN exclusivo.
                         */
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/google").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/email-verification/confirm").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/password-recovery/request").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/password-recovery/reset").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/admin/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/usuarios").permitAll()

                        /*
                         * Marketplace público.
                         */
                        .requestMatchers(HttpMethod.GET, "/api/tiendas").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tiendas/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tiendas/*/productos").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/productos").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/productos/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/rubros").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/rubros/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tipos-entrega").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tipos-entrega/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tipos-producto").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tipos-producto/**").permitAll()

                        /*
                         * Contexto público autenticado: cliente/vendedor.
                         * Un token ADMIN no debe entrar a estas rutas.
                         */
                        .requestMatchers(HttpMethod.GET, "/api/usuarios/me").access(publicAccess())
                        .requestMatchers(HttpMethod.PUT, "/api/usuarios/me").access(publicAccess())
                        .requestMatchers(HttpMethod.PUT, "/api/account/password").access(publicAccess())
                        .requestMatchers(HttpMethod.GET, "/api/usuarios/me/documentos").access(publicAccess())
                        .requestMatchers(HttpMethod.GET, "/api/usuarios/me/documentos/**").access(publicAccess())
                        .requestMatchers(HttpMethod.POST, "/api/usuarios/me/documentos").access(publicAccess())
                        .requestMatchers(HttpMethod.GET, "/api/tipos-documento").access(publicAccess())
                        .requestMatchers(HttpMethod.GET, "/api/tipos-documento/**").access(publicAccess())
                        .requestMatchers(HttpMethod.POST, "/api/checkout/sessions").access(clienteVerificadoAccess())
                        .requestMatchers(HttpMethod.POST, "/api/webhooks/mercado-pago").permitAll()

                        /*
                         * Conversión / perfil vendedor:
                         * Un usuario autenticado en contexto público puede crear o consultar
                         * su perfil vendedor y registrar su primera tienda. Productos,
                         * pedidos y demas acciones operativas requieren rol VENDEDOR.
                         */
                        .requestMatchers(HttpMethod.GET, "/api/vendedores/me").access(publicAccess())
                        .requestMatchers(HttpMethod.POST, "/api/vendedores/me").access(publicAccess())
                        .requestMatchers(HttpMethod.GET, "/api/vendedores/me/tiendas").access(publicAccess())
                        .requestMatchers(HttpMethod.GET, "/api/vendedores/me/tiendas/*").access(publicAccess())
                        .requestMatchers(HttpMethod.POST, "/api/vendedores/me/tiendas").access(publicVerificadoAccess())
                        .requestMatchers(HttpMethod.PUT, "/api/vendedores/me/tiendas/*").access(vendedorVerificadoAccess())
                        .requestMatchers("/api/vendedores/me/**").access(vendedorVerificadoAccess())

                        /*
                         * Panel administrativo.
                         * Requiere rol ADMIN y token emitido desde el contexto ADMIN.
                         */
                        .requestMatchers("/api/admin/**").access(adminAccess())

                        /*
                         * Pedidos del cliente autenticado.
                         */
                        .requestMatchers(HttpMethod.POST, "/api/pedidos/confirmar").access(clienteVerificadoAccess())
                        .requestMatchers(HttpMethod.POST, "/api/pedidos/*/pagos").access(clienteVerificadoAccess())
                        .requestMatchers(HttpMethod.GET, "/api/pedidos").access(clienteAccess())
                        .requestMatchers(HttpMethod.GET, "/api/pedidos/**").access(clienteAccess())

                        /*
                         * Catch-all del vendedor: rutas no específicas bajo /api/vendedores.
                         */
                        .requestMatchers("/api/vendedores/**").access(vendedorAccess())

                        /*
                         * Cualquier otra ruta autenticada pertenece al contexto público.
                         */
                        .anyRequest().access(publicAccess())
                )

                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

                .build();
    }

    private static AuthorizationManager<RequestAuthorizationContext> adminAccess() {
        return requireAuthorities(ROLE_ADMIN, AUTH_CONTEXT_ADMIN);
    }

    private static AuthorizationManager<RequestAuthorizationContext> clienteAccess() {
        return requireAuthorities(ROLE_CLIENTE, AUTH_CONTEXT_PUBLIC);
    }

    private AuthorizationManager<RequestAuthorizationContext> clienteVerificadoAccess() {
        return requireVerifiedAuthorities(ROLE_CLIENTE, AUTH_CONTEXT_PUBLIC);
    }

    private static AuthorizationManager<RequestAuthorizationContext> vendedorAccess() {
        return requireAuthorities(ROLE_VENDEDOR, AUTH_CONTEXT_PUBLIC);
    }

    private AuthorizationManager<RequestAuthorizationContext> vendedorVerificadoAccess() {
        return requireVerifiedAuthorities(ROLE_VENDEDOR, AUTH_CONTEXT_PUBLIC);
    }

    private static AuthorizationManager<RequestAuthorizationContext> publicAccess() {
        return requireAuthorities(AUTH_CONTEXT_PUBLIC);
    }

    private AuthorizationManager<RequestAuthorizationContext> publicVerificadoAccess() {
        return requireVerifiedAuthorities(AUTH_CONTEXT_PUBLIC);
    }

    private AuthorizationManager<RequestAuthorizationContext> requireVerifiedAuthorities(String... requiredAuthorities) {
        AuthorizationManager<RequestAuthorizationContext> authoritiesManager = requireAuthorities(requiredAuthorities);

        return (authenticationSupplier, context) -> {
            AuthorizationDecision authoritiesDecision = authoritiesManager.check(authenticationSupplier, context);

            if (authoritiesDecision == null || !authoritiesDecision.isGranted()) {
                return new AuthorizationDecision(false);
            }

            return emailVerifiedAuthorizationManager.check(authenticationSupplier, context);
        };
    }

    private static AuthorizationManager<RequestAuthorizationContext> requireAuthorities(String... requiredAuthorities) {
        return (authenticationSupplier, context) -> {
            Authentication authentication = authenticationSupplier.get();

            boolean granted = authentication != null
                    && authentication.isAuthenticated()
                    && Arrays.stream(requiredAuthorities)
                    .allMatch(requiredAuthority -> hasAuthority(authentication, requiredAuthority));

            return new AuthorizationDecision(granted);
        };
    }

    private static boolean hasAuthority(Authentication authentication, String authority) {
        return authentication.getAuthorities()
                .stream()
                .anyMatch(grantedAuthority -> authority.equals(grantedAuthority.getAuthority()));
    }
}
