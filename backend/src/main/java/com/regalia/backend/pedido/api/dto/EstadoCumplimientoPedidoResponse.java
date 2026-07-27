package com.regalia.backend.pedido.api.dto;

/** Respuesta ligera de una transicion operativa de un pedido. */
public record EstadoCumplimientoPedidoResponse(Long idPedido, String estadoPedido) {}
