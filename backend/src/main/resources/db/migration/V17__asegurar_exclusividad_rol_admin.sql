-- =========================================================
-- V17 - Asegurar exclusividad del rol ADMIN
-- Un usuario con rol ADMIN activo no puede tener otros roles
-- activos. La regla aplica aunque el usuario este desactivado,
-- porque protege el estado de sus roles vigentes.
-- =========================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM usuario_rol ur
        JOIN rol r ON r.id_rol = ur.id_rol
        WHERE ur.estado = TRUE
        GROUP BY ur.id_usuario
        HAVING bool_or(r.nombre = 'ADMIN') AND count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Existen usuarios con rol ADMIN combinado con otros roles activos';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION validar_exclusividad_rol_admin()
RETURNS TRIGGER AS $$
DECLARE
    v_nombre_rol VARCHAR(50);
    v_tiene_admin_activo BOOLEAN;
    v_tiene_otro_rol_activo BOOLEAN;
BEGIN
    -- Roles inactivos se permiten como historial; no otorgan permisos vigentes.
    IF NEW.estado IS DISTINCT FROM TRUE THEN
        RETURN NEW;
    END IF;

    SELECT nombre
    INTO v_nombre_rol
    FROM rol
    WHERE id_rol = NEW.id_rol;

    IF v_nombre_rol IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM usuario_rol ur
        JOIN rol r ON r.id_rol = ur.id_rol
        WHERE ur.id_usuario = NEW.id_usuario
          AND ur.estado = TRUE
          AND ur.id_rol <> NEW.id_rol
          AND r.nombre = 'ADMIN'
    )
    INTO v_tiene_admin_activo;

    SELECT EXISTS (
        SELECT 1
        FROM usuario_rol ur
        JOIN rol r ON r.id_rol = ur.id_rol
        WHERE ur.id_usuario = NEW.id_usuario
          AND ur.estado = TRUE
          AND ur.id_rol <> NEW.id_rol
          AND r.nombre <> 'ADMIN'
    )
    INTO v_tiene_otro_rol_activo;

    IF v_nombre_rol = 'ADMIN' AND v_tiene_otro_rol_activo THEN
        RAISE EXCEPTION 'El rol ADMIN debe ser exclusivo para el usuario %', NEW.id_usuario
            USING ERRCODE = '23514';
    END IF;

    IF v_nombre_rol <> 'ADMIN' AND v_tiene_admin_activo THEN
        RAISE EXCEPTION 'Un usuario con rol ADMIN no puede tener otros roles activos: %', NEW.id_usuario
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_exclusividad_rol_admin
BEFORE INSERT OR UPDATE OF id_usuario, id_rol, estado
ON usuario_rol
FOR EACH ROW
EXECUTE FUNCTION validar_exclusividad_rol_admin();