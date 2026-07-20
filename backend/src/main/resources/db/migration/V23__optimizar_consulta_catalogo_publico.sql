-- Indices parciales para sostener la paginacion y la carga de imagenes del catalogo publico.
CREATE INDEX IF NOT EXISTS idx_producto_catalogo_publico
    ON producto (id_tipo_producto, precio, id_producto)
    WHERE estado = TRUE AND visible_en_tienda = TRUE;

CREATE INDEX IF NOT EXISTS idx_tienda_catalogo_publico
    ON tienda (estado_revision, id_tienda)
    WHERE estado = TRUE;

CREATE INDEX IF NOT EXISTS idx_producto_imagen_catalogo
    ON producto_imagen (id_producto, orden)
    WHERE estado = TRUE;
