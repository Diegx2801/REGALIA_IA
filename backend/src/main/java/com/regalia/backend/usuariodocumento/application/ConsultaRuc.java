package com.regalia.backend.usuariodocumento.application;

/** Modelo interno de una consulta tributaria, independiente del proveedor externo. */
public record ConsultaRuc(
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
