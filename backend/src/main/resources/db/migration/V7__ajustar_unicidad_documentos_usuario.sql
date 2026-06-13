-- =========================================================
-- V7 - Ajuste de unicidad en documentos de usuario
-- Reemplaza la unicidad global del documento por reglas de verificación.
-- Evita múltiples documentos activos del mismo tipo por usuario.
-- Permite que solo un documento verificado sea único globalmente.
-- =========================================================

ALTER TABLE usuario_documento
DROP CONSTRAINT IF EXISTS uq_usuario_documento_tipo_numero;

CREATE UNIQUE INDEX uq_usuario_documento_usuario_tipo_activo
ON usuario_documento (id_usuario, id_tipo_documento)
WHERE estado = TRUE;

CREATE UNIQUE INDEX uq_usuario_documento_tipo_numero_verificado
ON usuario_documento (id_tipo_documento, numero_documento)
WHERE estado = TRUE
  AND estado_verificacion = 'VERIFICADO';