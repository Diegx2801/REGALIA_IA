-- =========================================================
-- V11 - Insertar tipos de producto base
-- Datos maestros iniciales para clasificar productos de regalo
-- dentro de REGALIA.
-- =========================================================

INSERT INTO tipo_producto (nombre, estado)
VALUES
    ('REGALO FISICO', TRUE),
    ('REGALO PERSONALIZADO', TRUE),
    ('PACK O BOX', TRUE),
    ('PRODUCTO COMESTIBLE', TRUE),
    ('ARREGLO FLORAL', TRUE),
    ('ACCESORIO', TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- =========================================================
-- Ajustar unicidad de producto por tienda solo para activos
-- Permite reutilizar nombres si el producto anterior fue desactivado.
-- =========================================================

ALTER TABLE producto
DROP CONSTRAINT IF EXISTS uq_producto_tienda_nombre;

DROP INDEX IF EXISTS uq_producto_tienda_nombre_activo;

CREATE UNIQUE INDEX uq_producto_tienda_nombre_activo
ON producto (id_tienda, UPPER(nombre))
WHERE estado = TRUE;