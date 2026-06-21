package com.regalia.backend.pedido.api;

import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.pedido.api.dto.PedidoRecibidoDetalleResponse;
import com.regalia.backend.pedido.api.dto.PedidoRecibidoResumenResponse;
import com.regalia.backend.pedido.application.PedidoRecibidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller para que el vendedor autenticado consulte los pedidos
 * recibidos en sus propias tiendas.
 *
 * Se usa el prefijo /me para evitar recibir idVendedor por URL.
 * El vendedor se obtiene a partir del token JWT autenticado.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/vendedores/me")
public class VendedorPedidoController {

    private final PedidoRecibidoService pedidoRecibidoService;

    /**
     * Lista todos los pedidos recibidos por las tiendas del vendedor autenticado.
     */
    @GetMapping("/pedidos")
    public ResponseEntity<ApiResponse<List<PedidoRecibidoResumenResponse>>> listarPedidosRecibidos(
            Authentication authentication
    ) {
        List<PedidoRecibidoResumenResponse> pedidos = pedidoRecibidoService
                .listarPedidosRecibidos(authentication.getName());

        return ResponseEntity.ok(
                ApiResponse.success(pedidos)
        );
    }

    /**
     * Lista los pedidos recibidos en una tienda específica del vendedor autenticado.
     */
    @GetMapping("/tiendas/{idTienda}/pedidos")
    public ResponseEntity<ApiResponse<List<PedidoRecibidoResumenResponse>>> listarPedidosRecibidosPorTienda(
            @PathVariable Long idTienda,
            Authentication authentication
    ) {
        List<PedidoRecibidoResumenResponse> pedidos = pedidoRecibidoService
                .listarPedidosRecibidosPorTienda(authentication.getName(), idTienda);

        return ResponseEntity.ok(
                ApiResponse.success(pedidos)
        );
    }

    /**
     * Obtiene el detalle de un pedido recibido por el vendedor autenticado.
     */
    @GetMapping("/pedidos/{idPedido}")
    public ResponseEntity<ApiResponse<PedidoRecibidoDetalleResponse>> buscarPedidoRecibidoPorId(
            @PathVariable Long idPedido,
            Authentication authentication
    ) {
        PedidoRecibidoDetalleResponse pedido = pedidoRecibidoService
                .buscarPedidoRecibidoPorId(authentication.getName(), idPedido);

        return ResponseEntity.ok(
                ApiResponse.success(pedido)
        );
    }
}