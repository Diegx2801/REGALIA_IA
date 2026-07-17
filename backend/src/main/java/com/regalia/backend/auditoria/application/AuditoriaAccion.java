package com.regalia.backend.auditoria.application;

/**
 * Acciones auditables registradas por la plataforma.
 */
public enum AuditoriaAccion {
    LOGIN_PUBLICO_EXITOSO,
    LOGIN_ADMIN_EXITOSO,
    LOGIN_ADMIN_FALLIDO,
    LOGIN_PUBLICO_LIMITADO,
    LOGIN_ADMIN_LIMITADO,
    RECUPERACION_CONTRASENA_SOLICITADA,
    RECUPERACION_CONTRASENA_COMPLETADA,
    CONTRASENA_CAMBIADA
}
