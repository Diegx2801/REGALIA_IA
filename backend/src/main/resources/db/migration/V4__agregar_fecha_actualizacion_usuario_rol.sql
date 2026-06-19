-- =========================================================
-- V4 - Auditoría en relaciones con metadata
-- Agrega fecha_actualizacion a usuario_rol y tienda_categoria.
-- Estas tablas tienen campos adicionales como estado, orden o principal.
-- =========================================================

ALTER TABLE usuario_rol
ADD COLUMN fecha_actualizacion TIMESTAMP;

ALTER TABLE tienda_categoria
ADD COLUMN fecha_actualizacion TIMESTAMP;