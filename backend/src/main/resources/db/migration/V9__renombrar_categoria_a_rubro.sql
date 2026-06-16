-- =========================================================
-- V9 - Renombrar categorias de tienda a rubros
-- Mejora la claridad del modelo de negocio:
-- rubro representa el giro o clasificación comercial de una tienda.
-- =========================================================

ALTER TABLE categoria
RENAME TO rubro;

ALTER TABLE rubro
RENAME COLUMN id_categoria TO id_rubro;

ALTER TABLE tienda_categoria
RENAME TO tienda_rubro;

ALTER TABLE tienda_rubro
RENAME COLUMN id_categoria TO id_rubro;

ALTER TABLE rubro
RENAME CONSTRAINT pk_categoria TO pk_rubro;

ALTER TABLE rubro
RENAME CONSTRAINT uq_categoria_nombre TO uq_rubro_nombre;

ALTER TABLE tienda_rubro
RENAME CONSTRAINT pk_tienda_categoria TO pk_tienda_rubro;

ALTER TABLE tienda_rubro
RENAME CONSTRAINT fk_tienda_categoria_categoria TO fk_tienda_rubro_rubro;

ALTER TABLE tienda_rubro
RENAME CONSTRAINT fk_tienda_categoria_tienda TO fk_tienda_rubro_tienda;