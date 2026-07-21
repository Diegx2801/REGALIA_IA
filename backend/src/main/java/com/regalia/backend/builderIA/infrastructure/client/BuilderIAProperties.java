package com.regalia.backend.builderIA.infrastructure.client;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuracion OpenAI-compatible para el proveedor IA de REGALIA.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "regalia.builder-ia")
public class BuilderIAProperties {

    private String baseUrl = "https://openrouter.ai/api/v1";
    private String chatCompletionsPath = "/chat/completions";
    private String model = "openai/gpt-4o-mini";
    private String apiKey;
    private String siteUrl;
    private String appName = "REGALIA";
    private int connectTimeoutMilliseconds = 5000;
    private int readTimeoutMilliseconds = 20000;
    private int recommendationMaxTokens = 500;
    private int chatMaxTokens = 300;
}
