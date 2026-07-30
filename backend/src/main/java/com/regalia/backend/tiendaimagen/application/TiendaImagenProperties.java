package com.regalia.backend.tiendaimagen.application;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** Límites configurables para la identidad visual de una tienda. */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "regalia.media.store-image")
public class TiendaImagenProperties {

    private long maxSizeBytes = 5_242_880;
    private long maxPixels = 20_000_000;
    private int logoMinWidth = 512;
    private int logoMinHeight = 512;
    private double logoMinAspectRatio = 0.9;
    private double logoMaxAspectRatio = 1.1;
    private int coverMinWidth = 1_500;
    private int coverMinHeight = 500;
    private double coverMinAspectRatio = 2.0;
    private double coverMaxAspectRatio = 5.0;
}
