-- =========================================================
-- V14 - Agregar codigo interno a tipo_pago
-- Separa:
-- - id: relación interna de BD
-- - codigo: lógica de negocio estable
-- - nombre: texto visible editable para frontend/admin
-- =========================================================

ALTER TABLE tipo_pago
ADD COLUMN codigo VARCHAR(50);

UPDATE tipo_pago
SET 
    codigo = 'SENA',
    nombre = 'Seña',
    descripcion = 'Pago inicial para reservar el pedido'
WHERE UPPER(TRIM(nombre)) IN ('SEÑA', 'SENA');

UPDATE tipo_pago
SET 
    codigo = 'RESTANTE',
    nombre = 'Restante',
    descripcion = 'Pago final del pedido'
WHERE UPPER(TRIM(nombre)) = 'RESTANTE';

UPDATE tipo_pago
SET 
    codigo = 'PAGO_COMPLETO',
    nombre = 'Pago completo',
    descripcion = 'Pago único por el total del pedido'
WHERE UPPER(TRIM(nombre)) IN ('PAGO COMPLETO', 'PAGO_COMPLETO');

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM tipo_pago
        WHERE codigo IS NULL
    ) THEN
        RAISE EXCEPTION 'Existen registros en tipo_pago sin codigo asignado';
    END IF;
END $$;

ALTER TABLE tipo_pago
ALTER COLUMN codigo SET NOT NULL;

ALTER TABLE tipo_pago
ADD CONSTRAINT uq_tipo_pago_codigo UNIQUE (codigo);

ALTER TABLE tipo_pago
ADD CONSTRAINT ck_tipo_pago_codigo_formato
CHECK (
    codigo = UPPER(codigo)
    AND codigo ~ '^[A-Z0-9_]+$'
);