package com.regalia.backend.usuariodocumento.infrastructure.client;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuracion privada del proveedor de consultas RUC.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "regalia.apisperu.ruc")
public class ApisPeruRucProperties {

    private String url = "https://dniruc.apisperu.com/api/v1/ruc";
    private String token = "";
    private int timeoutMilliseconds = 8000;
}
