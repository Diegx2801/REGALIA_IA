package com.regalia.backend.auth.security;

/**
 * Contexto desde el que se autenticó el usuario.
 * Permite separar sesiones públicas de sesiones administrativas.
 */
public enum AuthContext {
    PUBLIC,
    ADMIN
}
