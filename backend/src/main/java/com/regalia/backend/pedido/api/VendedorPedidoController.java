package com.regalia.backend.pedido.api;

import com.regalia.backend.pedido.api.dto.PedidoRecibidoDetalleResponse;
import com.regalia.backend.pedido.api.dto.PedidoRecibidoResumenResponse;
import com.regalia.backend.pedido.application.PedidoRecibidoService;
import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.shared.response.PaginaResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Rutas privadas de pedidos recibidos por las tiendas del vendedor autenticado. */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/vendedores/me")
public class VendedorPedidoController {

    private final PedidoRecibidoService pedidoRecibidoService;

    @GetMapping("/pedidos")
    public ResponseEntity<ApiResponse<PaginaResponse<PedidoRecibidoResumenResponse>>> listarPedidosRecibidos(
            Authentication authentication,
            @RequestParam(required = false) Long idTienda,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String estadoPago,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "fechaCreacion,desc") String sort
    ) {
        PaginaResponse<PedidoRecibidoResumenResponse> pedidos = pedidoRecibidoService
                .listarPedidosRecibidos(
                        authentication.getName(), idTienda, q, estado, estadoPago, page, size, sort
                );

        return ResponseEntity.ok(ApiResponse.success(pedidos));
    }

    /** Mantiene una URL por tienda para consumidores existentes, con el mismo contrato paginado. */
    @GetMapping("/tiendas/{idTienda}/pedidos")
    public ResponseEntity<ApiResponse<PaginaResponse<PedidoRecibidoResumenResponse>>> listarPedidosPorTienda(
            @PathVariable Long idTienda,
            Authentication authentication,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String estadoPago,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "fechaCreacion,desc") String sort
    ) {
        PaginaResponse<PedidoRecibidoResumenResponse> pedidos = pedidoRecibidoService
                .listarPedidosRecibidos(
                        authentication.getName(), idTienda, q, estado, estadoPago, page, size, sort
                );

        return ResponseEntity.ok(ApiResponse.success(pedidos));
    }

    @GetMapping("/pedidos/{idPedido}")
    public ResponseEntity<ApiResponse<PedidoRecibidoDetalleResponse>> buscarPedidoRecibidoPorId(
            @PathVariable Long idPedido,
            Authentication authentication
    ) {
        PedidoRecibidoDetalleResponse pedido = pedidoRecibidoService
                .buscarPedidoRecibidoPorId(authentication.getName(), idPedido);

        return ResponseEntity.ok(ApiResponse.success(pedido));
    }
}
