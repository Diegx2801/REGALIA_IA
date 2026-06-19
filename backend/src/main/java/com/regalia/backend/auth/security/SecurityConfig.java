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
                         * Autenticación y registro:
                         * Login y registro inicial de usuarios no requieren token JWT.
                         */
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/usuarios").permitAll()

                        /*
                         * Marketplace público:
                         * Rutas abiertas para visitantes y clientes.
                         * Solo exponen tiendas activas/no rechazadas y productos activos/visibles.
                         */
                        .requestMatchers(HttpMethod.GET, "/api/tiendas").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tiendas/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tiendas/*/productos").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/productos/*").permitAll()

                        /*
                         * Perfil propio:
                         * Cualquier usuario autenticado puede consultar y actualizar su propio perfil.
                         */
                        .requestMatchers(HttpMethod.GET, "/api/usuarios/me").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/usuarios/me").authenticated()

                        /*
                         * Documentos del usuario autenticado:
                         * Cualquier usuario autenticado puede registrar y consultar
                         * sus documentos enviados para verificación.
                         */
                        .requestMatchers(HttpMethod.GET, "/api/usuarios/me/documentos").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/usuarios/me/documentos/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/usuarios/me/documentos").authenticated()

                        /*
                         * Solicitudes de verificación de documentos:
                         * Solo ADMIN puede consultar, verificar, observar o rechazar
                         * documentos enviados por usuarios.
                         */
                        .requestMatchers(HttpMethod.GET, "/api/usuarios-documentos").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/usuarios-documentos/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/usuarios-documentos/**").hasRole("ADMIN")

                        /*
                         * Perfil vendedor del usuario autenticado:
                         * Cualquier usuario autenticado puede convertirse en vendedor
                         * y consultar su perfil vendedor.
                         */
                        .requestMatchers(HttpMethod.GET, "/api/vendedores/me").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/vendedores/me").authenticated()

                        /*
                         * Gestión de tiendas del vendedor autenticado:
                         * Rutas privadas del panel del vendedor.
                         */
                        .requestMatchers(HttpMethod.POST, "/api/vendedores/me/tiendas").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/vendedores/me/tiendas").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/vendedores/me/tiendas/*").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/vendedores/me/tiendas/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/vendedores/me/tiendas/*").authenticated()

                        /*
                         * Gestión de productos del vendedor autenticado:
                         * Rutas privadas y anidadas bajo la tienda del vendedor.
                         */
                        .requestMatchers(HttpMethod.POST, "/api/vendedores/me/tiendas/*/productos").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/vendedores/me/tiendas/*/productos").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/vendedores/me/tiendas/*/productos/*").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/vendedores/me/tiendas/*/productos/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/vendedores/me/tiendas/*/productos/*").authenticated()

                        /*
                         * Administración de vendedores:
                         * Solo ADMIN puede consultar la lista de vendedores
                         * y el detalle administrativo de un vendedor.
                         */
                        .requestMatchers(HttpMethod.GET, "/api/vendedores").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/vendedores/*").hasRole("ADMIN")

                        /*
                         * Rubros de tienda:
                         * Consultar es público, porque permite filtrar tiendas y productos
                         * sin necesidad de iniciar sesión.
                         * Crear, actualizar, desactivar y reactivar solo puede hacerlo ADMIN.
                         */
                        .requestMatchers(HttpMethod.GET, "/api/rubros").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/rubros/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/rubros").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/rubros/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/rubros/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/rubros/**").hasRole("ADMIN")

                        /*
                         * Roles:
                         * Información interna del sistema. Solo ADMIN puede consultarla.
                         */
                        .requestMatchers(HttpMethod.GET, "/api/roles/**").hasRole("ADMIN")

                        /*
                         * Usuarios:
                         * Operaciones administrativas sobre usuarios.
                         */
                        .requestMatchers(HttpMethod.GET, "/api/usuarios").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/usuarios/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/usuarios/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/usuarios/**").hasRole("ADMIN")

                        /*
                         * Tipos de pago:
                         * Catálogo interno del sistema para diferenciar el concepto
                         * del pago dentro del flujo de pedido: SEÑA y RESTANTE.
                         * Su administración y consulta directa queda reservada para ADMIN.
                         */
                        .requestMatchers(HttpMethod.GET, "/api/tipos-pago").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/tipos-pago/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/tipos-pago").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/tipos-pago/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/tipos-pago/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/tipos-pago/**").hasRole("ADMIN")

                        /*
                         * Tipos de documento:
                         * Los usuarios autenticados pueden consultarlos para registrar
                         * documentos de identidad o fiscales.
                         * Crear, actualizar, desactivar y reactivar solo puede hacerlo ADMIN.
                         */
                        .requestMatchers(HttpMethod.GET, "/api/tipos-documento").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/tipos-documento/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/tipos-documento").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/tipos-documento/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/tipos-documento/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/tipos-documento/**").hasRole("ADMIN")

                        /*
                        * Tipos de entrega:
                        * Catálogo usado para que el cliente seleccione cómo se coordinará
                        * la entrega del pedido. La consulta es pública porque puede mostrarse
                        * durante la exploración o creación del pedido.
                        * Crear, actualizar, desactivar y reactivar solo puede hacerlo ADMIN.
                        */
                        .requestMatchers(HttpMethod.GET, "/api/tipos-entrega").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tipos-entrega/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/tipos-entrega").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/tipos-entrega/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/tipos-entrega/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/tipos-entrega/**").hasRole("ADMIN")

                        /*
                         * Cualquier otra ruta requiere al menos autenticación.
                         */
                        .anyRequest().authenticated()
                )

                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

                .build();
    }
}