package com.regalia.backend.pedidocumplimiento.application;

import com.regalia.backend.auth.application.email.EmailDeliveryService;
import com.regalia.backend.pago.infrastructure.repository.PagoJpaRepository;
import com.regalia.backend.pedido.api.dto.EstadoCumplimientoPedidoResponse;
import com.regalia.backend.pedido.infrastructure.entity.PedidoEntity;
import com.regalia.backend.pedido.infrastructure.repository.PedidoJpaRepository;
import com.regalia.backend.pedidocumplimiento.infrastructure.entity.PedidoCumplimientoEntity;
import com.regalia.backend.pedidocumplimiento.infrastructure.repository.PedidoCumplimientoJpaRepository;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.shared.security.limite.LimiteSeguridadSolicitudService;
import com.regalia.backend.shared.security.limite.PoliticaLimiteSeguridad;
import com.regalia.backend.shared.security.limite.ReglaLimiteSeguridad;
import com.regalia.backend.shared.security.limite.TipoSujetoLimiteSeguridad;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Coordina el cumplimiento fisico de pedidos sin mezclarlo con pagos ni con
 * la auditoria de seguridad. El codigo nunca se persiste en texto plano.
 */
@Service
@RequiredArgsConstructor
public class PedidoCumplimientoService {

    private static final int LONGITUD_CODIGO = 6;
    private static final int MAXIMO_INTENTOS_CODIGO = 5;
    private static final Duration VIGENCIA_CODIGO = Duration.ofDays(7);
    private static final ReglaLimiteSeguridad REGLA_REEMISION_CODIGO =
            new ReglaLimiteSeguridad(3, Duration.ofDays(1), Duration.ofMinutes(1));

    private final PedidoJpaRepository pedidoRepository;
    private final PedidoCumplimientoJpaRepository cumplimientoRepository;
    private final PagoJpaRepository pagoRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailDeliveryService emailDeliveryService;
    private final LimiteSeguridadSolicitudService limiteSeguridadSolicitudService;
    private final UsuarioJpaRepository usuarioRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public EstadoCumplimientoPedidoResponse iniciarPreparacion(String correoVendedor, Long idPedido) {
        PedidoEntity pedido = obtenerPedidoVendedorParaActualizar(correoVendedor, idPedido);
        exigirEstado(pedido, PedidoEntity.ESTADO_RESERVADO, "iniciar la preparacion");

        pedido.setEstadoPedido(PedidoEntity.ESTADO_EN_PREPARACION);
        pedidoRepository.save(pedido);

        return respuesta(pedido);
    }

    @Transactional
    public EstadoCumplimientoPedidoResponse marcarListo(String correoVendedor, Long idPedido) {
        PedidoEntity pedido = obtenerPedidoVendedorParaActualizar(correoVendedor, idPedido);

        if (PedidoEntity.ESTADO_LISTO.equals(pedido.getEstadoPedido())) {
            return respuesta(pedido);
        }

        exigirEstado(pedido, PedidoEntity.ESTADO_EN_PREPARACION, "marcar el pedido como listo");
        exigirSaldoPagado(pedido);

        String codigoEntrega = generarCodigoEntrega();
        LocalDateTime ahora = LocalDateTime.now();
        PedidoCumplimientoEntity cumplimiento = new PedidoCumplimientoEntity();
        cumplimiento.setPedido(pedido);
        cumplimiento.setMetodoConfirmacion(PedidoCumplimientoEntity.METODO_CODIGO_ENTREGA);
        cumplimiento.setCodigoHash(passwordEncoder.encode(codigoEntrega));
        cumplimiento.setFechaExpiracionCodigo(ahora.plus(VIGENCIA_CODIGO));
        cumplimiento.setIntentosCodigo(0);
        cumplimiento.setFechaListo(ahora);
        cumplimientoRepository.save(cumplimiento);

        pedido.setEstadoPedido(PedidoEntity.ESTADO_LISTO);
        pedidoRepository.save(pedido);
        programarEnvioCodigoEntrega(pedido, codigoEntrega);

        return respuesta(pedido);
    }

    @Transactional
    public EstadoCumplimientoPedidoResponse confirmarEntrega(
            String correoVendedor,
            Long idPedido,
            String codigoEntrega
    ) {
        PedidoEntity pedido = obtenerPedidoVendedorParaActualizar(correoVendedor, idPedido);
        exigirEstado(pedido, PedidoEntity.ESTADO_LISTO, "confirmar la entrega");

        PedidoCumplimientoEntity cumplimiento = obtenerCumplimientoParaActualizar(idPedido);
        validarCodigoEntrega(cumplimiento, codigoEntrega);

        cumplimiento.setFechaConfirmacion(LocalDateTime.now());
        cumplimiento.setUsuarioConfirmador(pedido.getTienda().getVendedor().getUsuario());
        cumplimientoRepository.save(cumplimiento);

        pedido.setEstadoPedido(PedidoEntity.ESTADO_ENTREGADO);
        pedidoRepository.save(pedido);

        return respuesta(pedido);
    }

    @Transactional
    public void reenviarCodigoEntrega(String correoCliente, Long idPedido) {
        PedidoEntity pedido = pedidoRepository.findMiPedidoActivoParaActualizar(
                        idPedido,
                        obtenerIdUsuarioCliente(correoCliente)
                )
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el pedido solicitado"));

        exigirEstado(pedido, PedidoEntity.ESTADO_LISTO, "solicitar un nuevo codigo de entrega");
        PedidoCumplimientoEntity cumplimiento = obtenerCumplimientoParaActualizar(idPedido);

        if (cumplimiento.getFechaConfirmacion() != null) {
            throw new ReglaNegocioException("El pedido ya fue confirmado como entregado");
        }

        limiteSeguridadSolicitudService.registrarSolicitudPermitida(
                PoliticaLimiteSeguridad.REENVIO_CODIGO_ENTREGA,
                TipoSujetoLimiteSeguridad.USUARIO,
                String.valueOf(pedido.getUsuario().getIdUsuario()),
                REGLA_REEMISION_CODIGO
        );

        String codigoEntrega = generarCodigoEntrega();
        cumplimiento.setCodigoHash(passwordEncoder.encode(codigoEntrega));
        cumplimiento.setFechaExpiracionCodigo(LocalDateTime.now().plus(VIGENCIA_CODIGO));
        cumplimiento.setIntentosCodigo(0);
        cumplimientoRepository.save(cumplimiento);
        programarEnvioCodigoEntrega(pedido, codigoEntrega);
    }

    private PedidoEntity obtenerPedidoVendedorParaActualizar(String correoVendedor, Long idPedido) {
        return pedidoRepository.buscarPedidoRecibidoPorVendedorParaActualizar(correoVendedor, idPedido)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el pedido solicitado"));
    }

    private PedidoCumplimientoEntity obtenerCumplimientoParaActualizar(Long idPedido) {
        return cumplimientoRepository.findByPedidoIdPedidoForUpdate(idPedido)
                .orElseThrow(() -> new ReglaNegocioException(
                        "El pedido aun no esta disponible para confirmar la entrega"
                ));
    }

    private Long obtenerIdUsuarioCliente(String correoCliente) {
        return usuarioRepository.findByCorreoIgnoreCaseAndEstadoTrue(correoCliente)
                .map(UsuarioEntity::getIdUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el usuario autenticado"));
    }

    private void exigirEstado(PedidoEntity pedido, String estadoEsperado, String accion) {
        if (!estadoEsperado.equals(pedido.getEstadoPedido())) {
            throw new ReglaNegocioException("El pedido no puede " + accion + " en su estado actual");
        }
    }

    private void exigirSaldoPagado(PedidoEntity pedido) {
        BigDecimal montoPagado = pagoRepository.sumarPagosAprobadosPorPedido(pedido.getIdPedido());
        BigDecimal saldoPendiente = pedido.getTotal().subtract(
                montoPagado == null ? BigDecimal.ZERO : montoPagado
        ).max(BigDecimal.ZERO);

        if (saldoPendiente.signum() > 0) {
            throw new ReglaNegocioException("El cliente debe completar el pago antes de la entrega");
        }
    }

    private void validarCodigoEntrega(PedidoCumplimientoEntity cumplimiento, String codigoEntrega) {
        boolean expirado = !LocalDateTime.now().isBefore(cumplimiento.getFechaExpiracionCodigo());
        boolean excedioIntentos = cumplimiento.getIntentosCodigo() >= MAXIMO_INTENTOS_CODIGO;
        boolean coincide = !expirado && !excedioIntentos && passwordEncoder.matches(codigoEntrega, cumplimiento.getCodigoHash());

        if (coincide) return;

        if (!expirado && !excedioIntentos) {
            cumplimiento.setIntentosCodigo(cumplimiento.getIntentosCodigo() + 1);
            cumplimientoRepository.save(cumplimiento);
        }
        throw new ReglaNegocioException("No se pudo confirmar la entrega con ese codigo");
    }

    private String generarCodigoEntrega() {
        int limiteInferior = (int) Math.pow(10, LONGITUD_CODIGO - 1);
        int codigo = limiteInferior + secureRandom.nextInt(9 * limiteInferior);
        return String.valueOf(codigo);
    }

    private void programarEnvioCodigoEntrega(PedidoEntity pedido, String codigoEntrega) {
        String correoCliente = pedido.getUsuario().getCorreo();
        String nombreCliente = pedido.getUsuario().getNombre();
        Long idPedido = pedido.getIdPedido();
        String nombreTienda = pedido.getTienda().getNombre();

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            emailDeliveryService.enviarCodigoEntrega(
                    correoCliente,
                    nombreCliente,
                    idPedido,
                    nombreTienda,
                    codigoEntrega
            );
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                emailDeliveryService.enviarCodigoEntrega(
                        correoCliente,
                        nombreCliente,
                        idPedido,
                        nombreTienda,
                        codigoEntrega
                );
            }
        });
    }

    private EstadoCumplimientoPedidoResponse respuesta(PedidoEntity pedido) {
        return new EstadoCumplimientoPedidoResponse(pedido.getIdPedido(), pedido.getEstadoPedido());
    }
}
