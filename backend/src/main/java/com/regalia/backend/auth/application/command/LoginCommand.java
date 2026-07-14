package com.regalia.backend.auth.application.command;

/**
 * Comando interno para autenticar por correo y contrasena.
 * La validacion HTTP queda en la capa api/dto.
 */
public record LoginCommand(
        String correo,
        String contrasena
) {
}
