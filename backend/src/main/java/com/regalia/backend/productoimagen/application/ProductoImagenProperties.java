package com.regalia.backend.productoimagen.application;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** Límites configurables para medios de productos. */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "regalia.media.product-image")
public class ProductoImagenProperties {

    private int maxCount = 5;
    private long maxSizeBytes = 5_242_880;
}
