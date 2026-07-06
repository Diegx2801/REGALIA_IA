package com.regalia.backend.builderIA.infrastructure.client;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuracion del proveedor IA local compatible con el endpoint /v1/messages.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "regalia.builder-ia")
public class BuilderIAProperties {

    private String baseUrl = "http://localhost:8082";
    private String messagesPath = "/v1/messages";
    private String model = "claude-3-sonnet-20240229";
    private String apiKey = "freecc";
    private int recommendationMaxTokens = 500;
    private int chatMaxTokens = 300;
}
