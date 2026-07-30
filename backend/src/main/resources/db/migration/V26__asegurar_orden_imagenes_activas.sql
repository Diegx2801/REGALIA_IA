-- Las imágenes inactivas conservan historial, pero no deben reservar posiciones de la galería activa.
ALTER TABLE producto_imagen
    DROP CONSTRAINT uq_producto_imagen_orden;

CREATE UNIQUE INDEX uq_producto_imagen_orden_activa
    ON producto_imagen (id_producto, orden)
    WHERE estado = TRUE;
