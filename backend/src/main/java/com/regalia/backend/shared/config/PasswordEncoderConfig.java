package com.regalia.backend.shared.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Configuración encargada de exponer el PasswordEncoder usado para hashear contraseñas.
 */
@Configuration
public class PasswordEncoderConfig {

    /**
     * Define BCrypt como algoritmo de hashing para contraseñas.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}