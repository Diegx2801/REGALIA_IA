package com.regalia.backend.checkout.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

/**
 * Solicitud para crear una sesion de checkout externo.
 */
public record CheckoutSessionRequest(

        @NotBlank(message = "La pasarela es obligatoria")
        @Size(max = 50, message = "La pasarela no debe superar los 50 caracteres")
        String provider,

        @NotNull(message = "La tienda es obligatoria")
        Long idTienda,

        @NotNull(message = "El tipo de entrega es obligatorio")
        Long idTipoEntrega,

        @NotBlank(message = "La modalidad de pago es obligatoria")
        @Size(max = 50, message = "La modalidad de pago no debe superar los 50 caracteres")
        String codigoTipoPago,

        @NotNull(message = "La fecha de entrega es obligatoria")
        @FutureOrPresent(message = "La fecha de entrega no puede ser anterior a la fecha actual")
        LocalDate fechaEntrega,

        @Size(max = 1000, message = "La observacion no debe superar los 1000 caracteres")
        String observacion,

        @NotEmpty(message = "El checkout debe tener al menos un producto")
        List<@Valid CheckoutItemRequest> items
) {
}
