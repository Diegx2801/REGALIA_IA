package com.regalia.backend.usuario.infrastructure.repository;

/**
 * Lectura reducida usada para validar la vigencia de credenciales sin cargar
 * el perfil completo del usuario en cada request autenticado.
 */
public interface UsuarioEstadoAutenticacionProjection {

    Boolean getEstado();

    Integer getVersionAutenticacion();
}
