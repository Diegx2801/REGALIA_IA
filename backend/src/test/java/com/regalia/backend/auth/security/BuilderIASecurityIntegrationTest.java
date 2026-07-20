package com.regalia.backend.auth.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class BuilderIASecurityIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void rechazaRecomendacionesIaSinSesionAutenticada() {
        ResponseEntity<String> response = restTemplate.postForEntity(
                "/api/builder-ia/recomendar-productos",
                Map.of("busqueda", "Un regalo para aniversario"),
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).contains("No autorizado");
    }
}
