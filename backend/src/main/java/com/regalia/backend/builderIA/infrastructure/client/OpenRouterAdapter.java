package com.regalia.backend.builderIA.infrastructure.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.regalia.backend.builderIA.application.BuilderIAProvider;
import com.regalia.backend.shared.exception.ServicioExternoNoDisponibleException;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;

/** Adapter HTTP para OpenRouter y proveedores compatibles con Chat Completions. */
@Component
@RequiredArgsConstructor
public class OpenRouterAdapter implements BuilderIAProvider {

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
        validarConfiguracion();

        try {
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

            return extraerContenido(response);
        } catch (RestClientResponseException exception) {
            throw new ServicioExternoNoDisponibleException("El proveedor IA no esta disponible en este momento");
        } catch (ServicioExternoNoDisponibleException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ServicioExternoNoDisponibleException("No se pudo consultar el proveedor IA");
        }
    }

    private void validarConfiguracion() {
        if (!StringUtils.hasText(properties.getApiKey())
                || !StringUtils.hasText(properties.getBaseUrl())
                || !StringUtils.hasText(properties.getChatCompletionsPath())
                || !StringUtils.hasText(properties.getModel())) {
            throw new ServicioExternoNoDisponibleException("El proveedor IA no esta configurado");
        }
    }

    private String extraerContenido(String response) {
        if (!StringUtils.hasText(response)) {
            throw new ServicioExternoNoDisponibleException("El proveedor IA no devolvio contenido");
        }

        try {
            ChatCompletionResponse respuesta = objectMapper.readValue(response, ChatCompletionResponse.class);
            if (respuesta.choices() == null || respuesta.choices().isEmpty()
                    || respuesta.choices().getFirst() == null
                    || respuesta.choices().getFirst().message() == null) {
                throw new ServicioExternoNoDisponibleException("El proveedor IA devolvio una respuesta invalida");
            }

            String contenido = respuesta.choices().getFirst().message().content();
            if (!StringUtils.hasText(contenido)) {
                throw new ServicioExternoNoDisponibleException("El proveedor IA devolvio una respuesta invalida");
            }
            return contenido.trim();
        } catch (ServicioExternoNoDisponibleException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ServicioExternoNoDisponibleException("El proveedor IA devolvio una respuesta invalida");
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
