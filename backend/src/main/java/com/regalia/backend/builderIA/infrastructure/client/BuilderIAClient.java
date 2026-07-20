package com.regalia.backend.builderIA.infrastructure.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.shared.exception.ServicioExternoNoDisponibleException;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Cliente aislado para consultar el servicio IA local usado por el prototipo.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BuilderIAClient {

    private static final String MENSAJE_SERVICIO_NO_DISPONIBLE =
            "La asistencia inteligente no está disponible en este momento. Intenta nuevamente en unos minutos.";

    private final BuilderIAProperties properties;
    private final ObjectMapper objectMapper;
    private final RestTemplateBuilder restTemplateBuilder;

    public String consultarRecomendaciones(String prompt) {
        return consultarIA(prompt, properties.getRecommendationMaxTokens());
    }

    public String consultarChat(String prompt) {
        return consultarIA(prompt, properties.getChatMaxTokens());
    }

    private String consultarIA(String prompt, int maxTokens) {

    try {
        Map<String, Object> mensaje = new LinkedHashMap<>();
        mensaje.put("role", "user");
        mensaje.put("content", prompt);

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", properties.getModel());
        requestBody.put("max_tokens", maxTokens);
        requestBody.put("stream", false);
        requestBody.put("messages", List.of(mensaje));

        String jsonBody = objectMapper.writeValueAsString(requestBody);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", properties.getApiKey());

        HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

        RestTemplate restTemplate = new RestTemplate();
        String url = properties.getBaseUrl() + properties.getMessagesPath();


        String response = restTemplate.postForObject(
                url,
                entity,
                String.class
        );

        return extraerTexto(response);

    } catch (HttpClientErrorException exception) {
        log.warn("El proveedor IA rechazo la solicitud con estado {}", exception.getStatusCode());
        throw new ServicioExternoNoDisponibleException(MENSAJE_SERVICIO_NO_DISPONIBLE);

    } catch (RestClientException exception) {
        log.warn("No se pudo conectar con el proveedor IA configurado", exception);
        throw new ServicioExternoNoDisponibleException(MENSAJE_SERVICIO_NO_DISPONIBLE);

    } catch (Exception exception) {
        log.error("No se pudo procesar la respuesta del proveedor IA", exception);
        throw new ServicioExternoNoDisponibleException(MENSAJE_SERVICIO_NO_DISPONIBLE);
    }
}

    private String extraerTexto(String response) {
    if (response == null || response.isBlank()) {
        throw new ReglaNegocioException("El servicio IA no devolvio contenido");
    }

    StringBuilder resultado = new StringBuilder();

    java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
            "\"text\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\""
    );

    java.util.regex.Matcher matcher = pattern.matcher(response);

    while (matcher.find()) {
        String texto = matcher.group(1);

        texto = texto
                .replace("\\n", "\n")
                .replace("\\t", "\t")
                .replace("\\r", "")
                .replace("\\u00e1", "á")
                .replace("\\u00e9", "é")
                .replace("\\u00ed", "í")
                .replace("\\u00f3", "ó")
                .replace("\\u00fa", "ú")
                .replace("\\u00f1", "ñ")
                .replace("\\u00bf", "¿")
                .replace("\\u00a1", "¡")
                .replace("\\u2013", "–")
                .replace("\\u200b", "");

        resultado.append(texto);
    }

    String textoFinal = resultado.toString().trim();

    if (textoFinal.isBlank()) {
        throw new ReglaNegocioException("No se pudo extraer texto de la respuesta IA");
    }

    return textoFinal;
}
}
