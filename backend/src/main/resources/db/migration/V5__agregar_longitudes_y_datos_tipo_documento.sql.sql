-- =========================================================
-- V5 - Longitudes para tipos de documento
-- Agrega reglas de longitud para validar documentos en backend/frontend.
-- También inserta los tipos de documento iniciales.
-- =========================================================

ALTER TABLE tipo_documento
ADD COLUMN longitud_minima INTEGER NOT NULL DEFAULT 1;

ALTER TABLE tipo_documento
ADD COLUMN longitud_maxima INTEGER NOT NULL DEFAULT 20;

ALTER TABLE tipo_documento
ADD CONSTRAINT chk_tipo_documento_longitudes_validas
CHECK (
    longitud_minima > 0
    AND longitud_maxima > 0
    AND longitud_minima <= longitud_maxima
);

INSERT INTO tipo_documento (
    nombre,
    abreviatura,
    longitud_minima,
    longitud_maxima
)
VALUES
    ('DOCUMENTO NACIONAL DE IDENTIDAD', 'DNI', 8, 8),
    ('REGISTRO ÚNICO DE CONTRIBUYENTES', 'RUC', 11, 11),
    ('CARNÉ DE EXTRANJERÍA', 'CE', 9, 12)
ON CONFLICT (nombre) DO NOTHING;