-- ==========================================================
-- AJUSTE DE PEDIDOS, DETALLES, PAGOS Y COMISIONES
-- ==========================================================
-- Decisiones de diseño:
-- - El carrito no se guarda en BD; vive en frontend/localStorage.
-- - El pedido se crea recién cuando se registra un pago inicial válido.
-- - pedido guarda un snapshot financiero general: subtotal y total.
-- - detalle_pedido guarda productos, cantidades y precio unitario histórico.
-- - pago guarda cada pago real: SEÑA, RESTANTE, PAGO COMPLETO, etc.
-- - comision guarda la comisión generada por cada pago.
-- - No se agrega costo_entrega todavía; futuros cargos/descuentos podrán
--   modelarse como una extensión separada.

ALTER TABLE pedido
ADD COLUMN subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
ADD COLUMN total NUMERIC(10,2) NOT NULL DEFAULT 0,
ADD COLUMN fecha_actualizacion TIMESTAMP;

ALTER TABLE detalle_pedido
ADD COLUMN fecha_actualizacion TIMESTAMP;

ALTER TABLE pago
ADD COLUMN fecha_actualizacion TIMESTAMP;

ALTER TABLE comision
ADD COLUMN fecha_actualizacion TIMESTAMP;

ALTER TABLE pedido
ADD CONSTRAINT ck_pedido_subtotal_no_negativo CHECK (subtotal >= 0),
ADD CONSTRAINT ck_pedido_total_no_negativo CHECK (total >= 0);

-- =========================
-- SEMILLA EXTRA: TIPO DE PAGO
-- =========================
-- PAGO COMPLETO: pago único por el total del pedido.

INSERT INTO tipo_pago (nombre, estado)
VALUES
    ('PAGO COMPLETO', TRUE)
ON CONFLICT (nombre) DO NOTHING;