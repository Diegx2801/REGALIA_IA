package com.regalia.backend.builderIA.infrastructure.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.regalia.backend.builderIA.application.BuilderIAProvider;
import com.regalia.backend.shared.exception.ConfiguracionExternaException;
import com.regalia.backend.shared.exception.ServicioExternoNoDisponibleException;
import com.regalia.backend.shared.exception.ServicioExternoRespuestaInvalidaException;
import com.regalia.backend.shared.integration.ExternalIntegrationExceptionMapper;
import com.regalia.backend.shared.integration.ExternalIntegrationLogger;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;

/** Adapter HTTP para OpenRouter y proveedores compatibles con Chat Completions. */
@Component
@RequiredArgsConstructor
public class OpenRouterAdapter implements BuilderIAProvider {

    private static final Logger LOGGER = LoggerFactory.getLogger(OpenRouterAdapter.class);
    private static final ExternalIntegrationExceptionMapper EXCEPTION_MAPPER =
            new ExternalIntegrationExceptionMapper();

    private final BuilderIAProperties properties;
    private final ObjectMapper objectMapper;
    private final RestTemplateBuilder restTemplateBuilder;

    @Override
    public String consultarRecomendaciones(String prompt) {
        return consultarIA(prompt, properties.getRecommendationMaxTokens(), true);
    }

    @Override
    public String consultarChat(String prompt) {
        return consultarIA(prompt, properties.getChatMaxTokens(), false);
    }

    private String consultarIA(String prompt, int maxTokens, boolean requiereJson) {
        long startedAtNanos = System.nanoTime();
        String operation = requiereJson ? "recommendations" : "chat";

        try {
            validarConfiguracion();
            ChatCompletionRequest request = new ChatCompletionRequest(
                    properties.getModel(),
                    maxTokens,
                    false,
                    List.of(new ChatMessage("user", prompt)),
                    requiereJson ? new ResponseFormat("json_object") : null
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(properties.getApiKey().trim());
            if (StringUtils.hasText(properties.getSiteUrl())) {
                headers.set("HTTP-Referer", properties.getSiteUrl().trim());
            }
            if (StringUtils.hasText(properties.getAppName())) {
                headers.set("X-Title", properties.getAppName().trim());
            }

            RestTemplate restTemplate = restTemplateBuilder
                    .setConnectTimeout(Duration.ofMillis(properties.getConnectTimeoutMilliseconds()))
                    .setReadTimeout(Duration.ofMillis(properties.getReadTimeoutMilliseconds()))
                    .build();
            String url = normalizarBaseUrl(properties.getBaseUrl()) + properties.getChatCompletionsPath();
            String response = restTemplate.postForObject(
                    url,
                    new HttpEntity<>(request, headers),
                    String.class
            );

            String contenido = extraerContenido(response);
            ExternalIntegrationLogger.logSuccess(LOGGER, "openrouter", operation, startedAtNanos);
            return contenido;
        } catch (RestClientResponseException exception) {
            ExternalIntegrationLogger.logFailure(LOGGER, "openrouter", operation, exception, startedAtNanos);
            throw EXCEPTION_MAPPER.map(
                    exception,
                    "La configuracion del proveedor IA no es valida",
                    "El proveedor IA rechazo la solicitud",
                    "El proveedor IA no esta disponible en este momento"
            );
        } catch (ServicioExternoNoDisponibleException exception) {
            ExternalIntegrationLogger.logFailure(LOGGER, "openrouter", operation, exception, startedAtNanos);
            throw exception;
        } catch (RestClientException exception) {
            ExternalIntegrationLogger.logFailure(LOGGER, "openrouter", operation, exception, startedAtNanos);
            throw new ServicioExternoNoDisponibleException("No se pudo consultar el proveedor IA", exception);
        } catch (Exception exception) {
            ExternalIntegrationLogger.logFailure(LOGGER, "openrouter", operation, exception, startedAtNanos);
            throw new ServicioExternoNoDisponibleException("No se pudo consultar el proveedor IA", exception);
        }
    }

    private void validarConfiguracion() {
        if (!StringUtils.hasText(properties.getApiKey())
                || !StringUtils.hasText(properties.getBaseUrl())
                || !StringUtils.hasText(properties.getChatCompletionsPath())
                || !StringUtils.hasText(properties.getModel())) {
            throw new ConfiguracionExternaException("El proveedor IA no esta configurado");
        }
    }

    private String extraerContenido(String response) {
        if (!StringUtils.hasText(response)) {
            throw new ServicioExternoRespuestaInvalidaException("El proveedor IA no devolvio contenido");
        }

        try {
            ChatCompletionResponse respuesta = objectMapper.readValue(response, ChatCompletionResponse.class);
            if (respuesta.choices() == null || respuesta.choices().isEmpty()
                    || respuesta.choices().getFirst() == null
                    || respuesta.choices().getFirst().message() == null) {
                throw new ServicioExternoRespuestaInvalidaException(
                        "El proveedor IA devolvio una respuesta invalida"
                );
            }

            String contenido = respuesta.choices().getFirst().message().content();
            if (!StringUtils.hasText(contenido)) {
                throw new ServicioExternoRespuestaInvalidaException(
                        "El proveedor IA devolvio una respuesta invalida"
                );
            }
            return contenido.trim();
        } catch (ServicioExternoNoDisponibleException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ServicioExternoRespuestaInvalidaException(
                    "El proveedor IA devolvio una respuesta invalida",
                    exception
            );
        }
    }

    private String normalizarBaseUrl(String baseUrl) {
        return baseUrl.trim().replaceAll("/+$", "");
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private record ChatCompletionRequest(
            String model,
            @JsonProperty("max_tokens") int maxTokens,
            boolean stream,
            List<ChatMessage> messages,
            @JsonProperty("response_format") ResponseFormat responseFormat
    ) {
    }

    private record ChatMessage(String role, String content) {
    }

    private record ResponseFormat(String type) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ChatCompletionResponse(List<ChatCompletionChoice> choices) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ChatCompletionChoice(ChatCompletionMessage message) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ChatCompletionMessage(String content) {
    }
}
