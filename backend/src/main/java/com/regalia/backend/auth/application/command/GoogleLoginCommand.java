package com.regalia.backend.auth.application.command;

/**
 * Comando interno para autenticar con Google Identity Services.
 */
public record GoogleLoginCommand(
        String idToken
) {
}
