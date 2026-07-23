ALTER TABLE producto_imagen
    ADD COLUMN clave_almacenamiento VARCHAR(500);

CREATE UNIQUE INDEX uq_producto_imagen_clave_almacenamiento
    ON producto_imagen (clave_almacenamiento)
    WHERE clave_almacenamiento IS NOT NULL;
