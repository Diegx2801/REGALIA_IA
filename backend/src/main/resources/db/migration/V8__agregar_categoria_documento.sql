-- =========================================================
-- V8 - Agregar categoria de documento
-- Clasifica los tipos de documento por finalidad:
-- IDENTIDAD_PERSONAL, FISCAL u OTRO.
-- =========================================================

CREATE TABLE IF NOT EXISTS categoria_documento (
    id_categoria_documento BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP
);

INSERT INTO categoria_documento (nombre, descripcion, estado)
VALUES
    ('IDENTIDAD_PERSONAL', 'Documentos utilizados para validar la identidad personal del usuario', TRUE),
    ('FISCAL', 'Documentos utilizados para validar informacion tributaria o fiscal', TRUE),
    ('OTRO', 'Documentos que no pertenecen a identidad personal ni fiscal', TRUE)
ON CONFLICT (nombre) DO NOTHING;

ALTER TABLE tipo_documento
ADD COLUMN IF NOT EXISTS id_categoria_documento BIGINT;

UPDATE tipo_documento
SET id_categoria_documento = (
    SELECT cd.id_categoria_documento
    FROM categoria_documento cd
    WHERE cd.nombre = 'IDENTIDAD_PERSONAL'
)
WHERE UPPER(abreviatura) IN ('DNI', 'CE', 'PAS', 'PASAPORTE')
  AND id_categoria_documento IS NULL;

UPDATE tipo_documento
SET id_categoria_documento = (
    SELECT cd.id_categoria_documento
    FROM categoria_documento cd
    WHERE cd.nombre = 'FISCAL'
)
WHERE UPPER(abreviatura) IN ('RUC')
  AND id_categoria_documento IS NULL;

UPDATE tipo_documento
SET id_categoria_documento = (
    SELECT cd.id_categoria_documento
    FROM categoria_documento cd
    WHERE cd.nombre = 'OTRO'
)
WHERE id_categoria_documento IS NULL;

ALTER TABLE tipo_documento
ALTER COLUMN id_categoria_documento SET NOT NULL;

ALTER TABLE tipo_documento
ADD CONSTRAINT fk_tipo_documento_categoria_documento
FOREIGN KEY (id_categoria_documento)
REFERENCES categoria_documento (id_categoria_documento);