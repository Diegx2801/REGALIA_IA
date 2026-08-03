package com.regalia.backend.builderIA.infrastructure.client;

import com.fasterxml.jackson.core.type.TypeReference;
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
class OpenRouterAdapterTest {

    @Mock
    private RestTemplateBuilder restTemplateBuilder;

    @Mock
    private RestTemplate restTemplate;

    @Test
    void consultaOpenRouterConBearerYEncapsulaLaRespuestaDeRecomendaciones() throws Exception {
        BuilderIAProperties properties = properties();
        when(restTemplateBuilder.setConnectTimeout(any(Duration.class))).thenReturn(restTemplateBuilder);
        when(restTemplateBuilder.setReadTimeout(any(Duration.class))).thenReturn(restTemplateBuilder);
        when(restTemplateBuilder.build()).thenReturn(restTemplate);
        when(restTemplate.postForObject(anyString(), any(), eq(String.class))).thenReturn("""
                {"choices":[{"message":{"content":"{\\"categorias\\":[\\"Flores\\"]}"}}]}
                """);

        OpenRouterAdapter adapter = new OpenRouterAdapter(properties, new ObjectMapper(), restTemplateBuilder);
        String respuesta = adapter.consultarRecomendaciones("Recomienda productos");

        assertThat(respuesta).isEqualTo("{\"categorias\":[\"Flores\"]}");

        ArgumentCaptor<HttpEntity<?>> entidad = ArgumentCaptor.forClass(HttpEntity.class);
        ArgumentCaptor<String> url = ArgumentCaptor.forClass(String.class);
        verify(restTemplate).postForObject(url.capture(), entidad.capture(), eq(String.class));

        assertThat(url.getValue()).isEqualTo("https://openrouter.ai/api/v1/chat/completions");
        assertThat(entidad.getValue().getHeaders().getFirst("Authorization"))
                .isEqualTo("Bearer clave-prueba");
        assertThat(entidad.getValue().getHeaders().getFirst("HTTP-Referer"))
                .isEqualTo("https://regalia.example");

        Map<String, Object> body = new ObjectMapper().convertValue(
                entidad.getValue().getBody(),
                new TypeReference<>() {
                }
        );
        assertThat(body).containsEntry("response_format", Map.of("type", "json_object"));
        assertThat(body).containsEntry("max_tokens", 500);
    }

    @Test
    void consultaChatNoSolicitaRespuestaJson() throws Exception {
        BuilderIAProperties properties = properties();
        when(restTemplateBuilder.setConnectTimeout(any(Duration.class))).thenReturn(restTemplateBuilder);
        when(restTemplateBuilder.setReadTimeout(any(Duration.class))).thenReturn(restTemplateBuilder);
        when(restTemplateBuilder.build()).thenReturn(restTemplate);
        when(restTemplate.postForObject(anyString(), any(), eq(String.class))).thenReturn("""
                {"choices":[{"message":{"content":"Respuesta del asistente"}}]}
                """);

        OpenRouterAdapter adapter = new OpenRouterAdapter(properties, new ObjectMapper(), restTemplateBuilder);
        String respuesta = adapter.consultarChat("Hola");

        assertThat(respuesta).isEqualTo("Respuesta del asistente");

        ArgumentCaptor<HttpEntity<?>> entidad = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForObject(anyString(), entidad.capture(), eq(String.class));

        Map<String, Object> body = new ObjectMapper().convertValue(
                entidad.getValue().getBody(),
                new TypeReference<>() {
                }
        );
        assertThat(body).doesNotContainKey("response_format");
        assertThat(body).containsEntry("max_tokens", 300);
    }

    private BuilderIAProperties properties() {
        BuilderIAProperties properties = new BuilderIAProperties();
        properties.setApiKey("clave-prueba");
        properties.setSiteUrl("https://regalia.example");
        properties.setAppName("REGALIA Test");
        return properties;
    }
}
