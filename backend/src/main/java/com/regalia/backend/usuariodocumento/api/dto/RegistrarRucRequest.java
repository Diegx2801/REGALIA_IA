package com.regalia.backend.usuariodocumento.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Solicitud para registrar un RUC fiscal despues de validarlo con el proveedor externo.
 */
public record RegistrarRucRequest(

        @NotBlank(message = "El RUC es obligatorio")
        @Pattern(regexp = "\\d{11}", message = "El RUC debe tener exactamente 11 digitos")
        String numeroRuc
) {
}
