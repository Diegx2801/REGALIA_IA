package com.regalia.backend.media.infrastructure.r2;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

/** Configuracion del proveedor de medios compatible con R2/S3. */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "regalia.media")
public class R2MediaProperties {

    private String provider = "NONE";
    private String publicBaseUrl = "";
    private Duration uploadUrlExpiration = Duration.ofMinutes(10);
    private String publicObjectCacheControl = "public, max-age=31536000, immutable";
    private R2 r2 = new R2();

    @Getter
    @Setter
    public static class R2 {
        private String bucket = "";
        private String endpoint = "";
        private String region = "auto";
        private String accessKeyId = "";
        private String secretAccessKey = "";
    }
}
