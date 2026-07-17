package com.regalia.backend.shared.security.limite;

/**
 * Identifica una regla de frecuencia reutilizable. Agregar una politica nueva
 * no requiere cambiar el esquema de base de datos.
 */
public enum PoliticaLimiteSeguridad {
    REENVIO_VERIFICACION_CORREO,
    SOLICITUD_RECUPERACION_CONTRASENA
}
