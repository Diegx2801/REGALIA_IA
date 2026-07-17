package com.regalia.backend.pedido.api;

import com.regalia.backend.pedido.api.dto.ConfirmarPedidoRequest;
import com.regalia.backend.pedido.api.dto.OpcionPagoResponse;
import com.regalia.backend.pedido.api.dto.PedidoClienteResumenResponse;
import com.regalia.backend.pedido.api.dto.PedidoResponse;
import com.regalia.backend.pedido.api.dto.RegistrarPagoPedidoRequest;
import com.regalia.backend.pedido.application.PedidoService;
import com.regalia.backend.shared.response.ApiResponse;
import com.regalia.backend.shared.response.PaginaResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Controlador REST para operaciones de pedidos del cliente autenticado.
 *
 * El carrito vive en frontend/localStorage.
 * El pedido se registra cuando el cliente confirma un pago inicial válido:
 * SENA o PAGO_COMPLETO.
 */
@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
public class PedidoController {

        private final PedidoService pedidoService;

        @GetMapping("/opciones/pago-inicial")
        public ResponseEntity<ApiResponse<List<OpcionPagoResponse>>> listarOpcionesPagoInicial() {
        List<OpcionPagoResponse> opciones = pedidoService.listarOpcionesPagoInicial();

        return ResponseEntity.ok(
                ApiResponse.success(opciones)
        );
        }

        @PostMapping("/confirmar")
        public ResponseEntity<ApiResponse<PedidoResponse>> confirmarPedido(
                Principal principal,
                @Valid @RequestBody ConfirmarPedidoRequest request
        ) {
                PedidoResponse response = pedidoService.confirmarPedido(principal.getName(), request);

                return ResponseEntity.status(HttpStatus.CREATED).body(
                        ApiResponse.success(response)
                );
        }

        @GetMapping
        public ResponseEntity<ApiResponse<PaginaResponse<PedidoClienteResumenResponse>>> listarMisPedidos(
                Principal principal,
                @RequestParam(required = false) String q,
                @RequestParam(required = false) String estado,
                @RequestParam(required = false) String estadoPago,
                @RequestParam(defaultValue = "0") Integer page,
                @RequestParam(defaultValue = "10") Integer size,
                @RequestParam(defaultValue = "fechaCreacion,desc") String sort
        ) {
                PaginaResponse<PedidoClienteResumenResponse> pedidos = pedidoService.listarMisPedidos(
                        principal.getName(),
                        q,
                        estado,
                        estadoPago,
                        page,
                        size,
                        sort
                );

                return ResponseEntity.ok(
                        ApiResponse.success(pedidos)
                );
        }

        @GetMapping("/{idPedido}")
        public ResponseEntity<ApiResponse<PedidoResponse>> obtenerMiPedidoPorId(
                Principal principal,
                @PathVariable Long idPedido
        ) {
                PedidoResponse pedido = pedidoService.obtenerMiPedidoPorId(principal.getName(), idPedido);

                return ResponseEntity.ok(
                        ApiResponse.success(pedido)
                );
        }

        @PostMapping("/{idPedido}/pagos")
        public ResponseEntity<ApiResponse<PedidoResponse>> registrarPagoPedido(
                Principal principal,
                @PathVariable Long idPedido,
                @Valid @RequestBody RegistrarPagoPedidoRequest request
        ) {
                PedidoResponse response = pedidoService.registrarPagoPedido(
                        principal.getName(),
                        idPedido,
                        request
                );

                return ResponseEntity.status(HttpStatus.CREATED).body(
                        ApiResponse.success(response)
                );
        }
}
