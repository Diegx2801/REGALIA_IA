package com.regalia.backend.pedido.application;

import com.regalia.backend.comision.infrastructure.repository.ComisionJpaRepository;
import com.regalia.backend.pago.application.gateway.PaymentGatewayRegistry;
import com.regalia.backend.pago.infrastructure.gateway.PaymentGatewayProperties;
import com.regalia.backend.pago.infrastructure.repository.PagoJpaRepository;
import com.regalia.backend.pedido.infrastructure.mapper.PedidoMapper;
import com.regalia.backend.pedido.infrastructure.repository.DetallePedidoJpaRepository;
import com.regalia.backend.pedido.infrastructure.repository.PedidoJpaRepository;
import com.regalia.backend.politicacomercial.application.PoliticaComercialService;
import com.regalia.backend.producto.infrastructure.repository.ProductoJpaRepository;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.tienda.infrastructure.repository.TiendaJpaRepository;
import com.regalia.backend.tipoentrega.infrastructure.repository.TipoEntregaJpaRepository;
import com.regalia.backend.tipopago.infrastructure.repository.TipoPagoJpaRepository;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PedidoServiceAdminTest {

    @Mock private PedidoJpaRepository pedidoRepository;
    @Mock private DetallePedidoJpaRepository detallePedidoRepository;
    @Mock private PagoJpaRepository pagoRepository;
    @Mock private ComisionJpaRepository comisionRepository;
    @Mock private UsuarioJpaRepository usuarioRepository;
    @Mock private TiendaJpaRepository tiendaRepository;
    @Mock private TipoEntregaJpaRepository tipoEntregaRepository;
    @Mock private TipoPagoJpaRepository tipoPagoRepository;
    @Mock private ProductoJpaRepository productoRepository;
    @Mock private PedidoMapper pedidoMapper;
    @Mock private PoliticaComercialService politicaComercialService;
    @Mock private PaymentGatewayRegistry paymentGatewayRegistry;
    @Mock private PaymentGatewayProperties paymentGatewayProperties;

    @InjectMocks private PedidoService pedidoService;

    @Test
    void filtraPedidosAdministrativosPorRangoInclusivoDeFechaCreacion() {
        when(pedidoRepository.findPedidosAdministracion(
                any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()
        )).thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 20), 0));

        pedidoService.listarPedidosAdmin(
                "CON_SALDO",
                "EN_PREPARACION",
                9L,
                "ID_TIENDA",
                "9",
                LocalDate.of(2026, 7, 1),
                LocalDate.of(2026, 7, 20),
                0,
                20,
                "total,desc"
        );

        verify(pedidoRepository).findPedidosAdministracion(
                eq(PedidoPagoFiltro.CON_SALDO),
                eq(PedidoAdminEstadoFiltro.EN_PREPARACION),
                eq(9L),
                eq(PedidoSearchField.ID_TIENDA),
                eq("9"),
                eq(9L),
                eq(LocalDateTime.of(2026, 7, 1, 0, 0)),
                eq(LocalDateTime.of(2026, 7, 21, 0, 0)),
                eq(PedidoAdminSortField.TOTAL),
                eq(Sort.Direction.DESC),
                any(Pageable.class)
        );
    }

    @Test
    void rechazaUnRangoAdministrativoConFechasInvertidas() {
        assertThatThrownBy(() -> pedidoService.listarPedidosAdmin(
                "TODOS",
                "TODOS",
                null,
                "ID_PEDIDO",
                null,
                LocalDate.of(2026, 7, 20),
                LocalDate.of(2026, 7, 1),
                0,
                10,
                "fechaCreacion,desc"
        ))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessage("La fecha desde no puede ser posterior a la fecha hasta");
    }
}
