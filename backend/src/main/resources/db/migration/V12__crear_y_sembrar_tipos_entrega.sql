-- =========================
-- SEMILLA: TIPO DE ENTREGA
-- =========================
-- REGALIA no gestiona delivery propio en la primera versión.
-- La entrega se registra como recojo o coordinación directa con el vendedor.

INSERT INTO tipo_entrega (nombre, estado)
VALUES
    ('RECOJO EN TIENDA', TRUE),
    ('ENTREGA COORDINADA CON VENDEDOR', TRUE)
ON CONFLICT (nombre) DO NOTHING;