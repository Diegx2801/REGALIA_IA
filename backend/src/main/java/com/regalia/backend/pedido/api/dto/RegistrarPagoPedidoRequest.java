package com.regalia.backend.pedido.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para registrar un pago adicional sobre un pedido existente.
 *
 * En el MVP se usa para registrar el pago RESTANTE.
 * El tipo de pago no se recibe desde frontend: el backend usa RESTANTE
 * porque el endpoint ya representa pagar el saldo pendiente.
 */
public record RegistrarPagoPedidoRequest(

        @NotBlank(message = "El método de pago es obligatorio")
        @Size(max = 50, message = "El método de pago no debe superar los 50 caracteres")
        String metodoPagoPasarela,

        @NotBlank(message = "El código de transacción es obligatorio")
        @Size(max = 100, message = "El código de transacción no debe superar los 100 caracteres")
        String codigoTransaccion
) {
}