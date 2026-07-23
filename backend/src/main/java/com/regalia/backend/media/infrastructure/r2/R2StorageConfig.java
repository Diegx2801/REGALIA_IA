package com.regalia.backend.media.infrastructure.r2;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

/** Construye los clientes S3 solo cuando R2 esta habilitado en la configuracion. */
@Configuration
@ConditionalOnProperty(prefix = "regalia.media", name = "provider", havingValue = "R2")
public class R2StorageConfig {

    @Bean
    public S3Client r2S3Client(R2MediaProperties properties) {
        return S3Client.builder()
                .endpointOverride(obtenerEndpoint(properties))
                .region(obtenerRegion(properties))
                .credentialsProvider(obtenerCredenciales(properties))
                .serviceConfiguration(configuracionS3())
                .build();
    }

    @Bean
    public S3Presigner r2S3Presigner(R2MediaProperties properties) {
        return S3Presigner.builder()
                .endpointOverride(obtenerEndpoint(properties))
                .region(obtenerRegion(properties))
                .credentialsProvider(obtenerCredenciales(properties))
                .serviceConfiguration(configuracionS3())
                .build();
    }

    private URI obtenerEndpoint(R2MediaProperties properties) {
        String endpoint = obligatorio(properties.getR2().getEndpoint(), "El endpoint R2 es obligatorio");
        return URI.create(endpoint.trim());
    }

    private Region obtenerRegion(R2MediaProperties properties) {
        return Region.of(obligatorio(properties.getR2().getRegion(), "La region R2 es obligatoria"));
    }

    private StaticCredentialsProvider obtenerCredenciales(R2MediaProperties properties) {
        String accessKeyId = obligatorio(
                properties.getR2().getAccessKeyId(),
                "El access key ID de R2 es obligatorio"
        );
        String secretAccessKey = obligatorio(
                properties.getR2().getSecretAccessKey(),
                "El secret access key de R2 es obligatorio"
        );

        return StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKeyId, secretAccessKey));
    }

    private S3Configuration configuracionS3() {
        return S3Configuration.builder()
                .pathStyleAccessEnabled(true)
                .build();
    }

    private String obligatorio(String valor, String mensaje) {
        if (!StringUtils.hasText(valor)) {
            throw new IllegalStateException(mensaje);
        }
        return valor.trim();
    }
}
