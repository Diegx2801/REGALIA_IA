package com.regalia.backend.usuariodocumento.infrastructure.client;

import com.regalia.backend.shared.exception.ConfiguracionExternaException;
import com.regalia.backend.shared.exception.ServicioExternoNoDisponibleException;
import com.regalia.backend.shared.exception.ServicioExternoRespuestaInvalidaException;
import com.regalia.backend.shared.integration.ExternalIntegrationExceptionMapper;
import com.regalia.backend.shared.integration.ExternalIntegrationLogger;
import com.regalia.backend.usuariodocumento.application.ConsultaRuc;
import com.regalia.backend.usuariodocumento.application.ConsultaRucProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;

/**
 * Adaptador HTTP aislado para consultar informacion tributaria de RUC.
 * El token se conserva exclusivamente en la configuracion del backend.
 */
@Component
public class ApisPeruRucClient implements ConsultaRucProvider {

    private static final Logger LOGGER = LoggerFactory.getLogger(ApisPeruRucClient.class);
    private static final ExternalIntegrationExceptionMapper EXCEPTION_MAPPER =
            new ExternalIntegrationExceptionMapper();

    private final ApisPeruRucProperties properties;
    private final RestClient.Builder restClientBuilder;

    @Autowired
    public ApisPeruRucClient(
            ApisPeruRucProperties properties,
            RestClient.Builder restClientBuilder
    ) {
        this.properties = properties;
        this.restClientBuilder = restClientBuilder;
    }

    /** Constructor mantenido para usos directos fuera del contenedor Spring. */
    public ApisPeruRucClient(ApisPeruRucProperties properties) {
        this(properties, RestClient.builder());
    }

    @Override
    public ConsultaRuc consultar(String numeroRuc) {
        long startedAtNanos = System.nanoTime();

        try {
            String token = obtenerToken();
            String url = obtenerUrl();
            ApisPeruRucDto respuesta = crearCliente(url)
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .pathSegment(numeroRuc)
                            .queryParam("token", token)
                            .build())
                    .retrieve()
                    .body(ApisPeruRucDto.class);

            if (respuesta == null || !StringUtils.hasText(respuesta.ruc())) {
                throw new ServicioExternoRespuestaInvalidaException(
                        "El servicio de consulta RUC no devolvio una respuesta valida"
                );
            }

            ConsultaRuc resultado = new ConsultaRuc(
                    respuesta.ruc(),
                    respuesta.razonSocial(),
                    respuesta.nombreComercial(),
                    respuesta.estado(),
                    respuesta.condicion(),
                    respuesta.direccion(),
                    respuesta.departamento(),
                    respuesta.provincia(),
                    respuesta.distrito()
            );
            ExternalIntegrationLogger.logSuccess(LOGGER, "apis-peru", "ruc-consultation", startedAtNanos);
            return resultado;
        } catch (RestClientResponseException exception) {
            ExternalIntegrationLogger.logFailure(
                    LOGGER,
                    "apis-peru",
                    "ruc-consultation",
                    exception,
                    startedAtNanos
            );
            throw EXCEPTION_MAPPER.map(
                    exception,
                    "La configuracion del servicio de consulta RUC no es valida",
                    "No se encontro informacion valida para el RUC indicado",
                    "El servicio de consulta RUC no esta disponible en este momento"
            );
        } catch (ServicioExternoNoDisponibleException exception) {
            ExternalIntegrationLogger.logFailure(
                    LOGGER,
                    "apis-peru",
                    "ruc-consultation",
                    exception,
                    startedAtNanos
            );
            throw exception;
        } catch (RestClientException exception) {
            ExternalIntegrationLogger.logFailure(
                    LOGGER,
                    "apis-peru",
                    "ruc-consultation",
                    exception,
                    startedAtNanos
            );
            throw new ServicioExternoNoDisponibleException(
                    "El servicio de consulta RUC no esta disponible en este momento",
                    exception
            );
        }
    }

    private RestClient crearCliente(String url) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        Duration timeout = Duration.ofMillis(properties.getTimeoutMilliseconds());
        requestFactory.setConnectTimeout(timeout);
        requestFactory.setReadTimeout(timeout);

        return restClientBuilder.clone()
                .baseUrl(url)
                .requestFactory(requestFactory)
                .build();
    }

    private String obtenerUrl() {
        String url = properties.getUrl();

        if (!StringUtils.hasText(url)) {
            throw new ConfiguracionExternaException("La URL del servicio de consulta RUC no esta configurada");
        }

        return url.trim().replaceAll("/+$", "");
    }

    private String obtenerToken() {
        String token = properties.getToken();

        if (!StringUtils.hasText(token)) {
            throw new ConfiguracionExternaException("El servicio de consulta RUC no esta configurado");
        }

        return token.trim();
    }

    record ApisPeruRucDto(
            String ruc,
            String razonSocial,
            String nombreComercial,
            String estado,
            String condicion,
            String direccion,
            String departamento,
            String provincia,
            String distrito
    ) {
    }
}
