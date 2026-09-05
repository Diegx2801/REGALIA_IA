package com.regalia.backend.auth.application;

import com.regalia.backend.auth.security.AuthContext;

/**
 * Puerto de aplicacion para limitar intentos fallidos de inicio de sesion.
 */
public interface LoginAttemptLimiter {

    void validarPermitido(AuthContext authContext, String correo, String ipCliente);

    LoginAttemptStatus registrarFallo(AuthContext authContext, String correo, String ipCliente);

    void registrarExito(AuthContext authContext, String correo, String ipCliente);
}
