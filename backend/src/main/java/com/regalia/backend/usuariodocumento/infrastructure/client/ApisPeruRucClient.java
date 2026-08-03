package com.regalia.backend.usuariodocumento.infrastructure.client;

import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.shared.exception.ServicioExternoNoDisponibleException;
import com.regalia.backend.usuariodocumento.application.ConsultaRuc;
import com.regalia.backend.usuariodocumento.application.ConsultaRucProvider;
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
        String token = obtenerToken();
        String url = obtenerUrl();

        try {
            ApisPeruRucDto respuesta = crearCliente(url)
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .pathSegment(numeroRuc)
                            .queryParam("token", token)
                            .build())
                    .retrieve()
                    .body(ApisPeruRucDto.class);

            if (respuesta == null || !StringUtils.hasText(respuesta.ruc())) {
                throw new ServicioExternoNoDisponibleException(
                        "El servicio de consulta RUC no devolvio una respuesta valida"
                );
            }

            return new ConsultaRuc(
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
        } catch (RestClientResponseException exception) {
            throw new ReglaNegocioException("No se encontro informacion valida para el RUC indicado");
        } catch (RestClientException exception) {
            throw new ServicioExternoNoDisponibleException(
                    "El servicio de consulta RUC no esta disponible en este momento"
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
            throw new ServicioExternoNoDisponibleException("La URL del servicio de consulta RUC no esta configurada");
        }

        return url.trim().replaceAll("/+$", "");
    }

    private String obtenerToken() {
        String token = properties.getToken();

        if (!StringUtils.hasText(token)) {
            throw new ServicioExternoNoDisponibleException("El servicio de consulta RUC no esta configurado");
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
