-- =========================================================
-- V10 - Insertar rubros base y ajustar revision de tienda
-- Inserta datos maestros para rubros de tiendas de regalos
-- estaticos y diferencia la revision comercial de REGALIA
-- de la verificacion documental.
-- =========================================================

-- =========================================================
-- 1. Insertar rubros base para tiendas
-- =========================================================

INSERT INTO rubro (nombre, descripcion, estado)
VALUES
    ('REGALOS PERSONALIZADOS', 'Tiendas enfocadas en regalos personalizados con nombres, fotos, frases o diseños especiales', TRUE),
    ('FLORES Y ARREGLOS', 'Tiendas que ofrecen ramos, flores y arreglos florales como regalo', TRUE),
    ('PELUCHES', 'Tiendas que ofrecen peluches, muñecos y regalos suaves', TRUE),
    ('DESAYUNOS SORPRESA', 'Tiendas que preparan desayunos sorpresa como detalle de regalo', TRUE),
    ('BOXES Y CANASTAS', 'Tiendas que venden cajas, boxes, canastas o combos de regalo', TRUE),
    ('CHOCOLATES Y DULCES', 'Tiendas que ofrecen chocolates, dulces, snacks o productos comestibles para regalo', TRUE),
    ('DETALLES ROMANTICOS', 'Tiendas enfocadas en detalles para parejas, aniversarios y fechas romanticas', TRUE),
    ('ACCESORIOS PERSONALIZADOS', 'Tiendas que ofrecen tazas, llaveros, cuadros, botellas, libretas u otros accesorios personalizados', TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- =========================================================
-- 2. Renombrar estado_verificacion de tienda a estado_revision
-- =========================================================

ALTER TABLE tienda
RENAME COLUMN estado_verificacion TO estado_revision;

ALTER TABLE tienda
DROP CONSTRAINT IF EXISTS ck_tienda_estado_verificacion;

UPDATE tienda
SET estado_revision = 'APROBADA'
WHERE estado_revision = 'VERIFICADA';

UPDATE tienda
SET estado_revision = 'PENDIENTE'
WHERE estado_revision = 'NO_SOLICITADA';

ALTER TABLE tienda
ALTER COLUMN estado_revision SET DEFAULT 'PENDIENTE';

ALTER TABLE tienda
ADD CONSTRAINT ck_tienda_estado_revision
CHECK (estado_revision IN (
    'PENDIENTE',
    'APROBADA',
    'OBSERVADA',
    'RECHAZADA'
));