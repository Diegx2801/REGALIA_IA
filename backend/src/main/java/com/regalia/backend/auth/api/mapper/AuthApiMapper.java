package com.regalia.backend.auth.api.mapper;

import com.regalia.backend.auth.api.dto.GoogleLoginRequest;
import com.regalia.backend.auth.api.dto.LoginRequest;
import com.regalia.backend.auth.api.dto.LoginResponse;
import com.regalia.backend.auth.application.command.GoogleLoginCommand;
import com.regalia.backend.auth.application.command.LoginCommand;
import com.regalia.backend.auth.application.result.LoginResult;

/**
 * Mapper de borde HTTP para no acoplar la capa de aplicacion a DTOs REST.
 */
public final class AuthApiMapper {

    private AuthApiMapper() {
    }

    public static LoginCommand toCommand(LoginRequest request) {
        return new LoginCommand(request.correo(), request.contrasena());
    }

    public static GoogleLoginCommand toCommand(GoogleLoginRequest request) {
        return new GoogleLoginCommand(request.idToken());
    }

    public static LoginResponse toResponse(LoginResult result) {
        return new LoginResponse(
                result.token(),
                result.tipo(),
                result.idUsuario(),
                result.correo(),
                result.roles(),
                result.authContext(),
                result.expiraEnMinutos()
        );
    }
}
