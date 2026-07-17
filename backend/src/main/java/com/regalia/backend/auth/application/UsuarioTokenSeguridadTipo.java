package com.regalia.backend.auth.application;

/**
 * Tipos internos de tokens de seguridad asociados a una cuenta REGALIA.
 * No es un catalogo administrable: cambiar estos valores impacta flujos de autenticacion.
 */
public enum UsuarioTokenSeguridadTipo {
    EMAIL_VERIFICATION,
    PASSWORD_RESET,
    EMAIL_CHANGE
}
