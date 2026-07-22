ALTER TABLE limite_seguridad_solicitud
    DROP CONSTRAINT IF EXISTS chk_limite_seguridad_solicitud_tipo_sujeto;

ALTER TABLE limite_seguridad_solicitud
    ADD CONSTRAINT chk_limite_seguridad_solicitud_tipo_sujeto
        CHECK (tipo_sujeto IN ('USUARIO', 'CORREO', 'IP', 'GLOBAL'));
