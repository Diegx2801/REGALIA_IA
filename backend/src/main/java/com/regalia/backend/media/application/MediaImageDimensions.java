package com.regalia.backend.media.application;

/** Dimensiones reales detectadas en un archivo de imagen. */
public record MediaImageDimensions(int ancho, int alto) {

    public MediaImageDimensions {
        if (ancho < 1 || alto < 1) {
            throw new IllegalArgumentException("Las dimensiones de imagen deben ser positivas");
        }
    }

    public double proporcion() {
        return (double) ancho / alto;
    }
}
