package com.regalia.backend.media.infrastructure.r2;

import com.regalia.backend.media.application.MediaObjectMetadata;
import com.regalia.backend.media.application.MediaStorage;
import com.regalia.backend.media.application.MediaUploadCommand;
import com.regalia.backend.media.application.MediaUploadTicket;
import com.regalia.backend.shared.exception.ServicioExternoNoDisponibleException;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.MetadataDirective;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Instant;
import java.util.Map;
import java.util.regex.Pattern;

/** Adaptador R2 para operaciones de objetos mediante la API compatible con S3. */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "regalia.media", name = "provider", havingValue = "R2")
public class R2MediaStorage implements MediaStorage {

    private static final Pattern PATRON_CLAVE_SEGURA = Pattern.compile("[A-Za-z0-9][A-Za-z0-9/_\\-.]{0,498}");

    private final S3Client r2S3Client;
    private final S3Presigner r2S3Presigner;
    private final R2MediaProperties properties;

    @Override
    public MediaUploadTicket generarCargaFirmada(MediaUploadCommand command) {
        validarClaveObjeto(command.claveObjeto());

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket())
                    .key(command.claveObjeto())
                    .contentType(command.tipoContenido().trim())
                    .build();
            PresignedPutObjectRequest firmado = r2S3Presigner.presignPutObject(
                    PutObjectPresignRequest.builder()
                            .signatureDuration(properties.getUploadUrlExpiration())
                            .putObjectRequest(request)
                            .build()
            );

            return new MediaUploadTicket(
                    firmado.url().toExternalForm(),
                    Map.of("Content-Type", command.tipoContenido().trim()),
                    Instant.now().plus(properties.getUploadUrlExpiration())
            );
        } catch (S3Exception | SdkClientException exception) {
            throw proveedorNoDisponible(exception);
        }
    }

    @Override
    public MediaObjectMetadata obtenerMetadata(String claveObjeto) {
        validarClaveObjeto(claveObjeto);

        try {
            HeadObjectResponse objeto = r2S3Client.headObject(
                    HeadObjectRequest.builder().bucket(bucket()).key(claveObjeto).build()
            );
            return new MediaObjectMetadata(
                    claveObjeto,
                    objeto.contentType(),
                    objeto.contentLength(),
                    objeto.lastModified()
            );
        } catch (S3Exception | SdkClientException exception) {
            throw proveedorNoDisponible(exception);
        }
    }

    @Override
    public byte[] leerCabecera(String claveObjeto, int cantidadMaximaBytes) {
        validarClaveObjeto(claveObjeto);
        if (cantidadMaximaBytes < 1 || cantidadMaximaBytes > 1024) {
            throw new IllegalArgumentException("La cantidad de bytes de cabecera no es valida");
        }

        try {
            return r2S3Client.getObjectAsBytes(GetObjectRequest.builder()
                    .bucket(bucket())
                    .key(claveObjeto)
                    .range("bytes=0-" + (cantidadMaximaBytes - 1))
                    .build()).asByteArray();
        } catch (S3Exception | SdkClientException exception) {
            throw proveedorNoDisponible(exception);
        }
    }

    @Override
    public void promoverObjeto(String claveOrigen, String claveDestino, String tipoContenido) {
        validarClaveObjeto(claveOrigen);
        validarClaveObjeto(claveDestino);

        String tipoNormalizado = obligatorio(tipoContenido, "El tipo de contenido del medio es obligatorio");
        String cacheControl = obligatorio(
                properties.getPublicObjectCacheControl(),
                "La politica de cache para medios publicos es obligatoria"
        );

        try {
            r2S3Client.copyObject(CopyObjectRequest.builder()
                    .copySource(bucket() + "/" + claveOrigen)
                    .destinationBucket(bucket())
                    .destinationKey(claveDestino)
                    .metadataDirective(MetadataDirective.REPLACE)
                    .contentType(tipoNormalizado)
                    .cacheControl(cacheControl)
                    .build());
        } catch (S3Exception | SdkClientException exception) {
            throw proveedorNoDisponible(exception);
        }
    }

    @Override
    public void eliminarObjeto(String claveObjeto) {
        validarClaveObjeto(claveObjeto);

        try {
            r2S3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket()).key(claveObjeto).build());
        } catch (S3Exception | SdkClientException exception) {
            throw proveedorNoDisponible(exception);
        }
    }

    @Override
    public String construirUrlPublica(String claveObjeto) {
        validarClaveObjeto(claveObjeto);
        String baseUrl = obligatorio(properties.getPublicBaseUrl(), "La URL publica de medios es obligatoria");
        return baseUrl.replaceFirst("/+$", "") + "/" + claveObjeto;
    }

    private String bucket() {
        return obligatorio(properties.getR2().getBucket(), "El bucket R2 es obligatorio");
    }

    private void validarClaveObjeto(String claveObjeto) {
        if (!StringUtils.hasText(claveObjeto) || !PATRON_CLAVE_SEGURA.matcher(claveObjeto).matches()) {
            throw new IllegalArgumentException("La clave del objeto de medios no es valida");
        }
    }

    private String obligatorio(String valor, String mensaje) {
        if (!StringUtils.hasText(valor)) {
            throw new IllegalStateException(mensaje);
        }
        return valor.trim();
    }

    private ServicioExternoNoDisponibleException proveedorNoDisponible(Exception exception) {
        return new ServicioExternoNoDisponibleException(
                "El almacenamiento de medios no esta disponible en este momento"
        );
    }
}
