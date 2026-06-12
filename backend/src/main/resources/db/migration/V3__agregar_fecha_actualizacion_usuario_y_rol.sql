-- =========================================================
-- V3 - Auditoría de actualización
-- Agrega fecha_actualizacion a usuario y rol.
-- Se permite NULL porque registros antiguos aún no fueron actualizados.
-- =========================================================

ALTER TABLE usuario
ADD COLUMN fecha_actualizacion TIMESTAMP;

ALTER TABLE rol
ADD COLUMN fecha_actualizacion TIMESTAMP;