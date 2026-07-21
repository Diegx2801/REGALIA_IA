package com.regalia.backend.builderIA.infrastructure.client;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Cliente aislado para proveedores compatibles con OpenAI, incluido OpenRouter.
 */
@Component
@RequiredArgsConstructor
public class BuilderIAClient {

    private final BuilderIAProperties properties;
    private final ObjectMapper objectMapper;
    private final RestTemplateBuilder restTemplateBuilder;

    public String consultarRecomendaciones(String prompt) {
        return consultarJson(prompt, properties.getRecommendationMaxTokens());
    }

    public String consultarChat(String prompt) {
        return consultarIA(prompt, properties.getChatMaxTokens(), false);
    }

    private String consultarJson(String prompt, int maxTokens) {
        return consultarIA(prompt, maxTokens, true);
    }

    private String consultarIA(String prompt, int maxTokens, boolean requiereJson) {
        validarConfiguracion();

        try {
            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("model", properties.getModel());
            requestBody.put("max_tokens", maxTokens);
            requestBody.put("stream", false);
            requestBody.put("messages", List.of(Map.of("role", "user", "content", prompt)));
            if (requiereJson) {
                requestBody.put("response_format", Map.of("type", "json_object"));
            }

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
                    new HttpEntity<>(requestBody, headers),
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
            String contenido = objectMapper.readTree(response)
                    .path("choices")
                    .path(0)
                    .path("message")
                    .path("content")
                    .asText();
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
}
