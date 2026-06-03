INSERT INTO tipo_pago (nombre, descripcion)
VALUES
    ('SEÑA', 'Pago inicial para reservar el pedido'),
    ('RESTANTE', 'Pago final del pedido')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO rol (nombre)
VALUES
    ('ADMIN'),
    ('CLIENTE'),
    ('VENDEDOR')
ON CONFLICT (nombre) DO NOTHING;