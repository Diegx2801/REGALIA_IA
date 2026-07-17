package com.regalia.backend.auth.application.oauth;

/**
 * Puerto de aplicacion para validar ID tokens de Google sin acoplar AuthService
 * a una libreria concreta de seguridad.
 */
public interface GoogleIdTokenVerifier {

    GoogleUserIdentity verify(String idToken);
}
