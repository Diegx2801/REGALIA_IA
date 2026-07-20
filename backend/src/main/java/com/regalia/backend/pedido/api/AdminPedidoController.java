package com.regalia.backend.pedido.api;

import com.regalia.backend.pedido.api.dto.PedidoResponse;
import com.regalia.backend.pedido.application.PedidoService;
import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.shared.response.PaginaResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

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
    public ResponseEntity<ApiResponse<PaginaResponse<PedidoResponse>>> listarPedidosAdmin(
            @RequestParam(required = false) String estadoPago,
            @RequestParam(required = false) String estadoPedido,
            @RequestParam(required = false) Long idTienda,
            @RequestParam(required = false) String searchField,
            @RequestParam(required = false) String search,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "fechaCreacion,desc") String sort
    ) {
        PaginaResponse<PedidoResponse> pedidos = pedidoService.listarPedidosAdmin(
                estadoPago,
                estadoPedido,
                idTienda,
                searchField,
                search,
                fechaDesde,
                fechaHasta,
                page,
                size,
                sort
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
