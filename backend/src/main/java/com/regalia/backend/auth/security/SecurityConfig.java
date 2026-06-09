package com.regalia.backend.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.regalia.backend.shared.response.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Configuración principal de seguridad para la API REST.
 *
 * Define:
 * - Rutas públicas.
 * - Rutas protegidas por autenticación.
 * - Rutas protegidas por rol.
 * - Manejo estandarizado de errores 401 y 403.
 * - Integración del filtro JWT dentro de Spring Security.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .exceptionHandling(exception -> exception

                        /*
                         * Se ejecuta cuando el usuario no está autenticado:
                         * - No envió token.
                         * - Envió un token inválido.
                         * - Envió un token expirado.
                         *
                         * Respuesta esperada: 401 Unauthorized.
                         */
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

                            ApiResponse<Void> apiResponse = ApiResponse.error("No autorizado");

                            objectMapper.writeValue(response.getOutputStream(), apiResponse);
                        })

                        /*
                         * Se ejecuta cuando el usuario sí está autenticado,
                         * pero no tiene permisos suficientes para acceder al recurso.
                         *
                         * Ejemplo:
                         * - CLIENTE intenta eliminar usuarios.
                         * - CLIENTE intenta consultar roles.
                         *
                         * Respuesta esperada: 403 Forbidden.
                         */
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

                            ApiResponse<Void> apiResponse = ApiResponse.error("Acceso denegado");

                            objectMapper.writeValue(response.getOutputStream(), apiResponse);
                        })
                )

                .authorizeHttpRequests(auth -> auth

                        /*
                         * Rutas públicas:
                         * No requieren token JWT.
                         */
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/usuarios").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tipos-pago/**").permitAll()

                        /*
                         * Perfil propio:
                         * Cualquier usuario autenticado puede consultar y actualizar su propio perfil.
                         *
                         * Importante:
                         * Estas rutas deben ir antes de /api/usuarios/**,
                         * porque /api/usuarios/me también coincide con /api/usuarios/**.
                         */
                        .requestMatchers(HttpMethod.GET, "/api/usuarios/me").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/usuarios/me").authenticated()

                        /*
                         * Roles:
                         * Información interna del sistema. Solo ADMIN puede consultarla.
                         */
                        .requestMatchers(HttpMethod.GET, "/api/roles/**").hasRole("ADMIN")

                        /*
                         * Usuarios:
                         * Operaciones administrativas sobre usuarios.
                         * Solo ADMIN puede listar, consultar por ID, actualizar por ID o desactivar usuarios.
                         */
                        .requestMatchers(HttpMethod.GET, "/api/usuarios").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/usuarios/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/usuarios/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/usuarios/**").hasRole("ADMIN")

                        /*
                         * Tipos de pago:
                         * Consultar es público, pero modificar el mantenedor solo puede hacerlo ADMIN.
                         */
                        .requestMatchers(HttpMethod.POST, "/api/tipos-pago").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/tipos-pago/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/tipos-pago/**").hasRole("ADMIN")

                        /*
                         * Cualquier otra ruta requiere al menos autenticación.
                         */
                        .anyRequest().authenticated()
                )

                /*
                 * Inserta nuestro filtro JWT antes del filtro estándar de autenticación por usuario/contraseña.
                 * Así cada request puede ser validado mediante el token enviado en Authorization: Bearer <token>.
                 */
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

                .build();
    }
}