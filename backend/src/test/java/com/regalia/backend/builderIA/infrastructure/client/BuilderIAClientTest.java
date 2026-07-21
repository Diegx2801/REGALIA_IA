package com.regalia.backend.builderIA.infrastructure.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BuilderIAClientTest {

    @Mock
    private RestTemplateBuilder restTemplateBuilder;

    @Mock
    private RestTemplate restTemplate;

    @Test
    void consultaOpenRouterConBearerYExtraeContenidoDeChatCompletion() {
        BuilderIAProperties properties = new BuilderIAProperties();
        properties.setApiKey("clave-prueba");
        properties.setSiteUrl("https://regalia.example");
        properties.setAppName("REGALIA Test");

        when(restTemplateBuilder.setConnectTimeout(any(Duration.class))).thenReturn(restTemplateBuilder);
        when(restTemplateBuilder.setReadTimeout(any(Duration.class))).thenReturn(restTemplateBuilder);
        when(restTemplateBuilder.build()).thenReturn(restTemplate);
        when(restTemplate.postForObject(anyString(), any(), eq(String.class))).thenReturn("""
                {"choices":[{"message":{"content":"{\\"categorias\\":[\\"Flores\\"]}"}}]}
                """);

        BuilderIAClient client = new BuilderIAClient(properties, new ObjectMapper(), restTemplateBuilder);
        String respuesta = client.consultarRecomendaciones("Recomienda productos");

        assertThat(respuesta).isEqualTo("{\"categorias\":[\"Flores\"]}");

        ArgumentCaptor<HttpEntity<?>> entidad = ArgumentCaptor.forClass(HttpEntity.class);
        ArgumentCaptor<String> url = ArgumentCaptor.forClass(String.class);
        verify(restTemplate).postForObject(url.capture(), entidad.capture(), eq(String.class));

        assertThat(url.getValue()).isEqualTo("https://openrouter.ai/api/v1/chat/completions");
        assertThat(entidad.getValue().getHeaders().getFirst("Authorization"))
                .isEqualTo("Bearer clave-prueba");
        assertThat(entidad.getValue().getHeaders().getFirst("HTTP-Referer"))
                .isEqualTo("https://regalia.example");

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) entidad.getValue().getBody();
        assertThat(body).containsEntry("response_format", Map.of("type", "json_object"));
    }
}
