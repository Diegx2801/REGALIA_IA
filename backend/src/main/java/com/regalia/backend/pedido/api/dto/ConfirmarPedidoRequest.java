package com.regalia.backend.pedido.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO para confirmar un pedido mediante un pago inicial.
 * El carrito vive en frontend/localStorage y se envía recién al confirmar.
 *
 * El pago inicial puede ser SENA o PAGO_COMPLETO.
 * El backend calcula el monto real según el codigo del tipo de pago.
 */
public record ConfirmarPedidoRequest(

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

        @Size(max = 1000, message = "La observación no debe superar los 1000 caracteres")
        String observacion,

        @NotBlank(message = "El método de pago es obligatorio")
        @Size(max = 50, message = "El método de pago no debe superar los 50 caracteres")
        String metodoPagoPasarela,

        @NotBlank(message = "El código de transacción es obligatorio")
        @Size(max = 100, message = "El código de transacción no debe superar los 100 caracteres")
        String codigoTransaccion,

        @NotEmpty(message = "El pedido debe tener al menos un producto")
        List<@Valid PedidoDetalleRequest> items
) {
}