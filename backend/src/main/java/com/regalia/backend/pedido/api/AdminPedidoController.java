package com.regalia.backend.pedido.api;

import com.regalia.backend.pedido.api.dto.PedidoResponse;
import com.regalia.backend.pedido.application.PedidoService;
import com.regalia.backend.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para operaciones administrativas sobre pedidos.
 *
 * El administrador puede visualizar pedidos globales del sistema,
 * sin limitarse a los pedidos de un cliente autenticado.
 */
@RestController
@RequestMapping("/api/admin/pedidos")
@RequiredArgsConstructor
public class AdminPedidoController {

    private final PedidoService pedidoService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PedidoResponse>>> listarPedidosAdmin(
            @RequestParam(required = false) String estadoPago,
            @RequestParam(required = false) String searchField,
            @RequestParam(required = false) String search
    ) {
        List<PedidoResponse> pedidos = pedidoService.listarPedidosAdmin(
                estadoPago,
                searchField,
                search
        );

        return ResponseEntity.ok(
                ApiResponse.success(pedidos)
        );
    }

    @GetMapping("/{idPedido}")
    public ResponseEntity<ApiResponse<PedidoResponse>> obtenerPedidoAdminPorId(
            @PathVariable Long idPedido
    ) {
        PedidoResponse pedido = pedidoService.obtenerPedidoAdminPorId(idPedido);

        return ResponseEntity.ok(
                ApiResponse.success(pedido)
        );
    }
}
