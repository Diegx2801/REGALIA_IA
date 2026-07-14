package com.regalia.backend.usuariodocumento.api.dto;

/**
 * Datos tributarios devueltos por el proveedor externo para un RUC consultado.
 */
public record ConsultaRucResponse(
        String ruc,
        String razonSocial,
        String nombreComercial,
        String estado,
        String condicion,
        String direccion,
        String departamento,
        String provincia,
        String distrito
) {
}
