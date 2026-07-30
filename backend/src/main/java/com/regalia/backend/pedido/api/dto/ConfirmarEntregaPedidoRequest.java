package com.regalia.backend.pedido.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Codigo compartido por el cliente al recibir su pedido. */
public record ConfirmarEntregaPedidoRequest(
        @NotBlank(message = "El codigo de entrega es obligatorio")
        @Pattern(regexp = "\\d{6}", message = "El codigo de entrega no es valido")
        String codigoEntrega
) {}
