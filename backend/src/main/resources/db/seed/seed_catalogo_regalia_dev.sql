-- =========================================================
-- REGALIA - Seed local de catalogo para desarrollo
-- Base de datos: PostgreSQL
-- Uso sugerido:
--   psql -h localhost -p 5432 -U regalia_user -d regalia_db -f seed_catalogo_regalia_dev.sql
--
-- Este archivo NO es una migracion Flyway.
-- Sirve para poblar datos reales visibles en el frontend local sin modificar
-- la estructura del backend ni depender de mocks.
-- =========================================================

BEGIN;

-- ---------------------------------------------------------
-- 1. Usuarios de desarrollo
-- ---------------------------------------------------------
-- Password para ambos usuarios: Regalia123!
-- Hash BCrypt generado con Spring Security para probar login real.
INSERT INTO usuario (
    nombres,
    apellidos,
    correo,
    telefono,
    contrasena_hash,
    estado
)
VALUES
    (
        'Admin',
        'REGALIA',
        'admin.demo@regalia.local',
        '999000111',
        '$2a$10$9XwnWUQSQ/yOxmpeEVR2Pe4gN7hAbgMatB0pkG4C3sJ5K439i1KB2',
        TRUE
    ),
    (
        'Camila',
        'Rojas',
        'vendedor.demo@regalia.local',
        '999111222',
        '$2a$10$9XwnWUQSQ/yOxmpeEVR2Pe4gN7hAbgMatB0pkG4C3sJ5K439i1KB2',
        TRUE
    ),
    (
        'Valeria',
        'Torres',
        'cliente.demo@regalia.local',
        '999333444',
        '$2a$10$9XwnWUQSQ/yOxmpeEVR2Pe4gN7hAbgMatB0pkG4C3sJ5K439i1KB2',
        TRUE
    )
ON CONFLICT (correo) DO UPDATE
SET
    nombres = EXCLUDED.nombres,
    apellidos = EXCLUDED.apellidos,
    telefono = EXCLUDED.telefono,
    estado = TRUE,
    fecha_actualizacion = CURRENT_TIMESTAMP;

-- La cuenta vendedor demo representa un comercio ya habilitado para probar
-- productos y pedidos. Se verifica de forma explicita sin relajar la regla
-- de seguridad aplicada a las cuentas reales.
UPDATE usuario
SET correo_verificado = TRUE,
    fecha_verificacion_correo = COALESCE(fecha_verificacion_correo, CURRENT_TIMESTAMP),
    fecha_actualizacion = CURRENT_TIMESTAMP
WHERE correo = 'vendedor.demo@regalia.local';

-- ---------------------------------------------------------
-- 2. Roles necesarios para probar flujos publicos y vendedor
-- ---------------------------------------------------------
INSERT INTO usuario_rol (id_usuario, id_rol, estado)
SELECT u.id_usuario, r.id_rol, TRUE
FROM usuario u
JOIN rol r ON r.nombre = 'VENDEDOR'
WHERE u.correo = 'vendedor.demo@regalia.local'
ON CONFLICT (id_usuario, id_rol) DO UPDATE
SET estado = TRUE,
    fecha_actualizacion = CURRENT_TIMESTAMP;

INSERT INTO usuario_rol (id_usuario, id_rol, estado)
SELECT u.id_usuario, r.id_rol, TRUE
FROM usuario u
JOIN rol r ON r.nombre = 'ADMIN'
WHERE u.correo = 'admin.demo@regalia.local'
ON CONFLICT (id_usuario, id_rol) DO UPDATE
SET estado = TRUE,
    fecha_actualizacion = CURRENT_TIMESTAMP;

INSERT INTO usuario_rol (id_usuario, id_rol, estado)
SELECT u.id_usuario, r.id_rol, TRUE
FROM usuario u
JOIN rol r ON r.nombre = 'CLIENTE'
WHERE u.correo = 'cliente.demo@regalia.local'
ON CONFLICT (id_usuario, id_rol) DO UPDATE
SET estado = TRUE,
    fecha_actualizacion = CURRENT_TIMESTAMP;

-- ---------------------------------------------------------
-- 3. Perfil vendedor y tienda aprobada
-- ---------------------------------------------------------
INSERT INTO vendedor (id_usuario, estado)
SELECT u.id_usuario, TRUE
FROM usuario u
WHERE u.correo = 'vendedor.demo@regalia.local'
ON CONFLICT (id_usuario) DO UPDATE
SET estado = TRUE,
    fecha_actualizacion = CURRENT_TIMESTAMP;

-- La tabla tienda permite mas de una tienda por vendedor en el esquema actual.
-- Por eso el seed actualiza por vendedor + nombre y luego inserta solo si no existe.
UPDATE tienda t
SET
    descripcion = 'Tienda local especializada en boxes premium, flores, detalles personalizados y regalos listos para reservar.',
    direccion_referencia = 'Miraflores, Lima',
    estado_revision = 'APROBADA',
    estado = TRUE,
    fecha_actualizacion = CURRENT_TIMESTAMP
FROM vendedor v
JOIN usuario u ON u.id_usuario = v.id_usuario
WHERE t.id_vendedor = v.id_vendedor
  AND UPPER(t.nombre) = UPPER('Bienestar Natural')
  AND u.correo = 'vendedor.demo@regalia.local';

INSERT INTO tienda (
    id_vendedor,
    nombre,
    descripcion,
    direccion_referencia,
    estado_revision,
    estado
)
SELECT
    v.id_vendedor,
    'Bienestar Natural',
    'Tienda local especializada en boxes premium, flores, detalles personalizados y regalos listos para reservar.',
    'Miraflores, Lima',
    'APROBADA',
    TRUE
FROM vendedor v
JOIN usuario u ON u.id_usuario = v.id_usuario
WHERE u.correo = 'vendedor.demo@regalia.local'
  AND NOT EXISTS (
      SELECT 1
      FROM tienda existente
      WHERE existente.id_vendedor = v.id_vendedor
        AND UPPER(existente.nombre) = UPPER('Bienestar Natural')
  );

-- ---------------------------------------------------------
-- 4. Rubros publicos de la tienda
-- ---------------------------------------------------------
INSERT INTO tienda_rubro (id_tienda, id_rubro, estado)
SELECT t.id_tienda, r.id_rubro, TRUE
FROM tienda t
JOIN vendedor v ON v.id_vendedor = t.id_vendedor
JOIN usuario u ON u.id_usuario = v.id_usuario
JOIN rubro r ON r.nombre IN (
    'REGALOS PERSONALIZADOS',
    'FLORES Y ARREGLOS',
    'BOXES Y CANASTAS',
    'CHOCOLATES Y DULCES'
)
WHERE u.correo = 'vendedor.demo@regalia.local'
ON CONFLICT ON CONSTRAINT pk_tienda_rubro DO UPDATE
SET estado = TRUE,
    fecha_actualizacion = CURRENT_TIMESTAMP;

-- ---------------------------------------------------------
-- 5. Productos visibles en catalogo publico
-- ---------------------------------------------------------
WITH tienda_demo AS (
    SELECT t.id_tienda
    FROM tienda t
    JOIN vendedor v ON v.id_vendedor = t.id_vendedor
    JOIN usuario u ON u.id_usuario = v.id_usuario
    WHERE u.correo = 'vendedor.demo@regalia.local'
),
productos_seed AS (
    SELECT
        'Box mama edicion especial'::VARCHAR AS nombre,
        'Box premium con taza, chocolates artesanales, tarjeta personalizada y flores de temporada.'::TEXT AS descripcion,
        129.00::NUMERIC(10,2) AS precio,
        14::INTEGER AS stock,
        'PACK O BOX'::VARCHAR AS tipo_producto,
        '/assets/brand/iconos/diadelamadre.png'::VARCHAR AS url_imagen
    UNION ALL
    SELECT
        'Arreglo floral radiante',
        'Ramo floral de ocasion con empaque elegante, dedicatoria y presentacion lista para regalar.',
        99.00::NUMERIC(10,2),
        10::INTEGER,
        'ARREGLO FLORAL',
        '/assets/brand/iconos/flores.png'
    UNION ALL
    SELECT
        'Torta eres unica',
        'Torta mini personalizada para celebraciones especiales, con mensaje corto y decoracion premium.',
        85.00::NUMERIC(10,2),
        8::INTEGER,
        'PRODUCTO COMESTIBLE',
        '/assets/brand/iconos/torta-2.png'
    UNION ALL
    SELECT
        'Detalle relax personalizado',
        'Detalle de bienestar con accesorios, aroma suave y tarjeta personalizada para sorprender con calma.',
        119.00::NUMERIC(10,2),
        6::INTEGER,
        'REGALO PERSONALIZADO',
        '/assets/brand/iconos/box-personalizado.png'
    UNION ALL
    SELECT
        'Pack aniversario memorable',
        'Pack romantico con chocolates, flores y tarjeta para aniversarios o fechas especiales.',
        149.00::NUMERIC(10,2),
        5::INTEGER,
        'PACK O BOX',
        '/assets/brand/iconos/aniversario.png'
    UNION ALL
    SELECT
        'Graduacion con estilo',
        'Detalle elegante para graduacion con presentacion premium y dedicatoria personalizada.',
        109.00::NUMERIC(10,2),
        7::INTEGER,
        'ACCESORIO',
        '/assets/brand/iconos/graduacion.png'
)
INSERT INTO producto (
    id_tienda,
    id_tipo_producto,
    nombre,
    descripcion,
    precio,
    stock,
    visible_en_tienda,
    estado
)
SELECT
    td.id_tienda,
    tp.id_tipo_producto,
    ps.nombre,
    ps.descripcion,
    ps.precio,
    ps.stock,
    TRUE,
    TRUE
FROM productos_seed ps
CROSS JOIN tienda_demo td
JOIN tipo_producto tp ON tp.nombre = ps.tipo_producto
ON CONFLICT (id_tienda, UPPER(nombre))
WHERE estado = TRUE
DO UPDATE
SET
    id_tipo_producto = EXCLUDED.id_tipo_producto,
    descripcion = EXCLUDED.descripcion,
    precio = EXCLUDED.precio,
    stock = EXCLUDED.stock,
    visible_en_tienda = TRUE,
    estado = TRUE,
    fecha_actualizacion = CURRENT_TIMESTAMP;

-- ---------------------------------------------------------
-- 6. Imagen principal por producto
-- ---------------------------------------------------------
WITH tienda_demo AS (
    SELECT t.id_tienda
    FROM tienda t
    JOIN vendedor v ON v.id_vendedor = t.id_vendedor
    JOIN usuario u ON u.id_usuario = v.id_usuario
    WHERE u.correo = 'vendedor.demo@regalia.local'
),
imagenes_seed AS (
    SELECT 'Box mama edicion especial'::VARCHAR AS nombre, '/assets/brand/iconos/diadelamadre.png'::VARCHAR AS url_imagen
    UNION ALL SELECT 'Arreglo floral radiante', '/assets/brand/iconos/flores.png'
    UNION ALL SELECT 'Torta eres unica', '/assets/brand/iconos/torta-2.png'
    UNION ALL SELECT 'Detalle relax personalizado', '/assets/brand/iconos/box-personalizado.png'
    UNION ALL SELECT 'Pack aniversario memorable', '/assets/brand/iconos/aniversario.png'
    UNION ALL SELECT 'Graduacion con estilo', '/assets/brand/iconos/graduacion.png'
)
INSERT INTO producto_imagen (
    id_producto,
    url_imagen,
    orden,
    estado
)
SELECT
    p.id_producto,
    i.url_imagen,
    1,
    TRUE
FROM imagenes_seed i
JOIN tienda_demo td ON TRUE
JOIN producto p ON p.id_tienda = td.id_tienda
              AND UPPER(p.nombre) = UPPER(i.nombre)
ON CONFLICT (id_producto, orden) DO UPDATE
SET
    url_imagen = EXCLUDED.url_imagen,
    estado = TRUE;

COMMIT;

-- Verificacion rapida esperada:
-- SELECT COUNT(*) FROM tienda WHERE estado = TRUE AND estado_revision = 'APROBADA';
-- SELECT COUNT(*) FROM producto WHERE estado = TRUE AND visible_en_tienda = TRUE;
