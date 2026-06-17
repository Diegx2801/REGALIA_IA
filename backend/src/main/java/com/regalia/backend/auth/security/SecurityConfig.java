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
                         *
                         * Importante:
                         * - Crear perfil vendedor NO exige documento verificado.
                         * - vendedorVerificado se calcula desde usuario_documento.
                         * - El rol VENDEDOR se asigna al crear el perfil vendedor.
                         */
                        .requestMatchers(HttpMethod.GET, "/api/vendedores/me").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/vendedores/me").authenticated()

                        /*
                         * Administración de vendedores:
                         * Solo ADMIN puede consultar la lista de vendedores
                         * y el detalle administrativo de un vendedor.
                         *
                         * Nota:
                         * /api/vendedores/me se declara antes porque pertenece
                         * al usuario autenticado y no al listado administrativo.
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
                         * Tiendas del vendedor autenticado:
                         * Se exige autenticación en SecurityConfig.
                         * La validación de perfil vendedor activo se realiza en TiendaService
                         * consultando la BD actual, para evitar depender de un JWT que podría
                         * no tener aún el rol VENDEDOR después de crear el perfil vendedor.
                         */
                        .requestMatchers(HttpMethod.POST, "/api/tiendas").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/tiendas/mis-tiendas").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/tiendas/*").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/tiendas/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/tiendas/*").authenticated()

                        /*
                        * Productos de tiendas:
                        * Se exige autenticación en SecurityConfig.
                        * La validación real de perfil vendedor activo, propiedad de tienda
                        * y propiedad del producto se realiza en ProductoService.
                        *
                        * Importante:
                        * - El producto siempre pertenece a una tienda activa.
                        * - Solo el vendedor dueño de la tienda puede gestionar sus productos.
                        * - No usamos hasRole("VENDEDOR") por el mismo motivo del módulo tienda:
                        *   el JWT podría no tener aún el rol VENDEDOR después de crear el perfil.
                        */
                        .requestMatchers(HttpMethod.POST, "/api/tiendas/*/productos").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/tiendas/*/productos").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/productos/*").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/productos/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/productos/*").authenticated()

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
                        * Los usuarios autenticados pueden consultar los métodos disponibles
                        * al realizar operaciones dentro de la plataforma.
                        * Crear, actualizar, desactivar y reactivar solo puede hacerlo ADMIN.
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
                        .requestMatchers(HttpMethod.GET, "/api/tipos-documento/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/tipos-documento").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/tipos-documento/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/tipos-documento/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/tipos-documento/**").hasRole("ADMIN")

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