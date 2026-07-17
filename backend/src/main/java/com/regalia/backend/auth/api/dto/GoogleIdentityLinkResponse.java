package com.regalia.backend.auth.api.dto;

/**
 * Respuesta publica de una identidad Google vinculada a la cuenta autenticada.
 */
public record GoogleIdentityLinkResponse(
        String proveedor,
        String correo,
        boolean vinculada
) {
}
