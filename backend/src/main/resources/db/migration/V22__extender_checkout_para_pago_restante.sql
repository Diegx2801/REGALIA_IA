-- Una sesion de checkout puede crear un pedido o cobrar el saldo de uno existente.
ALTER TABLE checkout_session
    ADD COLUMN tipo_operacion VARCHAR(30) NOT NULL DEFAULT 'PAGO_INICIAL',
    ADD COLUMN redirect_url TEXT;

ALTER TABLE checkout_session
    ADD CONSTRAINT chk_checkout_session_tipo_operacion
        CHECK (tipo_operacion IN ('PAGO_INICIAL', 'PAGO_RESTANTE'));

-- Evita que clics repetidos creen dos cobros externos activos para el mismo saldo.
CREATE UNIQUE INDEX uq_checkout_session_pago_restante_activo
    ON checkout_session (id_pedido, tipo_operacion)
    WHERE estado = TRUE
      AND tipo_operacion = 'PAGO_RESTANTE'
      AND estado_checkout IN ('CREADA', 'PENDIENTE');
