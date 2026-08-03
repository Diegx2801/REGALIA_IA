package com.regalia.backend.shared.integration;

import com.regalia.backend.shared.exception.ConfiguracionExternaException;
import com.regalia.backend.shared.exception.ServicioExternoNoDisponibleException;
import com.regalia.backend.shared.exception.ServicioExternoRechazoException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClientResponseException;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class ExternalIntegrationExceptionMapperTest {

    private final ExternalIntegrationExceptionMapper mapper = new ExternalIntegrationExceptionMapper();

    @Test
    void clasificaErroresDeAutenticacionComoConfiguracion() {
        RestClientResponseException exception = HttpClientErrorException.create(
                HttpStatus.UNAUTHORIZED,
                "Unauthorized",
                HttpHeaders.EMPTY,
                new byte[0],
                StandardCharsets.UTF_8
        );

        RuntimeException resultado = mapper.map(exception, "config", "rechazo", "indisponible");

        assertThat(resultado).isInstanceOf(ConfiguracionExternaException.class);
        assertThat(resultado.getCause()).isSameAs(exception);
    }

    @Test
    void clasificaErroresDeSolicitudComoRechazo() {
        RestClientResponseException exception = HttpClientErrorException.create(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                HttpHeaders.EMPTY,
                new byte[0],
                StandardCharsets.UTF_8
        );

        RuntimeException resultado = mapper.map(exception, "config", "rechazo", "indisponible");

        assertThat(resultado).isInstanceOf(ServicioExternoRechazoException.class);
        assertThat(resultado.getCause()).isSameAs(exception);
    }

    @Test
    void clasificaLimitesYErroresDelProveedorComoIndisponibilidad() {
        RestClientResponseException limite = HttpClientErrorException.create(
                HttpStatus.TOO_MANY_REQUESTS,
                "Too Many Requests",
                HttpHeaders.EMPTY,
                new byte[0],
                StandardCharsets.UTF_8
        );
        RestClientResponseException servidor = HttpServerErrorException.create(
                HttpStatus.BAD_GATEWAY,
                "Bad Gateway",
                HttpHeaders.EMPTY,
                new byte[0],
                StandardCharsets.UTF_8
        );

        assertThat(mapper.map(limite, "config", "rechazo", "indisponible"))
                .isInstanceOf(ServicioExternoNoDisponibleException.class);
        assertThat(mapper.map(servidor, "config", "rechazo", "indisponible"))
                .isInstanceOf(ServicioExternoNoDisponibleException.class);
    }
}
