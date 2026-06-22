package com.regalia.backend.shared.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configuracion CORS centralizada para clientes web autorizados.
 */
@Configuration
@RequiredArgsConstructor
public class CorsConfig {

    private final CorsProperties corsProperties;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(normalizarLista(corsProperties.getAllowedOrigins()));
        configuration.setAllowedMethods(normalizarLista(corsProperties.getAllowedMethods()));
        configuration.setAllowedHeaders(normalizarLista(corsProperties.getAllowedHeaders()));
        configuration.setExposedHeaders(normalizarLista(corsProperties.getExposedHeaders()));
        configuration.setAllowCredentials(corsProperties.isAllowCredentials());
        configuration.setMaxAge(corsProperties.getMaxAgeSeconds());

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    private List<String> normalizarLista(List<String> valores) {
        return valores.stream()
                .map(String::trim)
                .filter(valor -> !valor.isBlank())
                .toList();
    }
}
