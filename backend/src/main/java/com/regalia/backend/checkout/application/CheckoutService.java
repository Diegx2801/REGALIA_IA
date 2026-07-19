package com.regalia.backend.checkout.application;

import com.regalia.backend.checkout.api.dto.CheckoutItemRequest;
import com.regalia.backend.checkout.api.dto.CheckoutSessionRequest;
import com.regalia.backend.checkout.api.dto.CheckoutSessionResponse;
import com.regalia.backend.checkout.infrastructure.entity.CheckoutSessionEntity;
import com.regalia.backend.checkout.infrastructure.entity.CheckoutSessionItemEntity;
import com.regalia.backend.checkout.infrastructure.repository.CheckoutSessionJpaRepository;
import com.regalia.backend.pago.application.gateway.PaymentGatewayProvider;
import com.regalia.backend.pago.application.gateway.PaymentGatewayRegistry;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayCheckoutCommand;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayCheckoutResult;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayRedirectUrls;
import com.regalia.backend.pago.infrastructure.gateway.PaymentGatewayProperties;
import com.regalia.backend.pago.infrastructure.repository.PagoJpaRepository;
import com.regalia.backend.pedido.infrastructure.entity.PedidoEntity;
import com.regalia.backend.pedido.infrastructure.repository.PedidoJpaRepository;
import com.regalia.backend.politicacomercial.application.PoliticaComercialService;
import com.regalia.backend.producto.infrastructure.entity.ProductoEntity;
import com.regalia.backend.producto.infrastructure.repository.ProductoJpaRepository;
import com.regalia.backend.shared.exception.RecursoDuplicadoException;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import com.regalia.backend.tienda.infrastructure.repository.TiendaJpaRepository;
import com.regalia.backend.tipoentrega.infrastructure.entity.TipoEntregaEntity;
import com.regalia.backend.tipoentrega.infrastructure.repository.TipoEntregaJpaRepository;
import com.regalia.backend.tipopago.infrastructure.entity.TipoPagoEntity;
import com.regalia.backend.tipopago.infrastructure.repository.TipoPagoJpaRepository;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Prepara sesiones de pago sin persistir pedidos hasta recibir confirmacion confiable.
 */
@Service
@RequiredArgsConstructor
public class CheckoutService {

    private static final String CODIGO_TIPO_PAGO_SENA = "SENA";
    private static final String CODIGO_TIPO_PAGO_COMPLETO = "PAGO_COMPLETO";
    private static final String CODIGO_TIPO_PAGO_RESTANTE = "RESTANTE";
    private static final String ESTADO_REVISION_APROBADA = "APROBADA";
    private static final BigDecimal CIEN = new BigDecimal("100.00");

    private final UsuarioJpaRepository usuarioRepository;
    private final TiendaJpaRepository tiendaRepository;
    private final TipoEntregaJpaRepository tipoEntregaRepository;
    private final TipoPagoJpaRepository tipoPagoRepository;
    private final ProductoJpaRepository productoRepository;
    private final PedidoJpaRepository pedidoRepository;
    private final PagoJpaRepository pagoRepository;
    private final PoliticaComercialService politicaComercialService;
    private final PaymentGatewayRegistry paymentGatewayRegistry;
    private final PaymentGatewayProperties paymentGatewayProperties;
    private final CheckoutSessionJpaRepository checkoutSessionRepository;

    @Transactional(noRollbackFor = ReglaNegocioException.class)
    public CheckoutSessionResponse crearSesionCheckout(
            String correoUsuario,
            CheckoutSessionRequest request
    ) {
        UsuarioEntity usuario = obtenerUsuarioActivoPorCorreo(correoUsuario);
        TiendaEntity tienda = obtenerTiendaActivaPorId(request.idTienda());

        validarTiendaDisponibleParaCompra(tienda);
        validarUsuarioNoCompraSuPropiaTienda(usuario, tienda);

        TipoEntregaEntity tipoEntrega = obtenerTipoEntregaActivoPorId(request.idTipoEntrega());
        TipoPagoEntity tipoPago = obtenerTipoPagoActivoPorCodigo(request.codigoTipoPago());
        String codigoTipoPago = normalizarCodigo(tipoPago.getCodigo());

        validarTipoPagoInicial(codigoTipoPago);
        validarItemsCheckout(request.items());
        validarProductosDuplicados(request.items());

        BigDecimal total = calcularTotalCheckout(request.items(), tienda.getIdTienda());
        BigDecimal montoCheckout = calcularMontoPagoInicial(
                codigoTipoPago,
                total,
                politicaComercialService.obtenerPorcentajeSena()
        );
        String externalReference = generarExternalReference(usuario, tienda);
        CheckoutSessionEntity checkoutSession = crearCheckoutSession(
                usuario,
                tienda,
                tipoEntrega,
                tipoPago,
                codigoTipoPago,
                request,
                total,
                montoCheckout,
                externalReference
        );
        checkoutSessionRepository.save(checkoutSession);

        PaymentGatewayCheckoutResult checkoutResult = prepararCheckoutExterno(
                checkoutSession,
                new PaymentGatewayCheckoutCommand(
                        PaymentGatewayProvider.from(request.provider()),
                        montoCheckout,
                        paymentGatewayProperties.getCurrency(),
                        usuario.getIdUsuario(),
                        usuario.getCorreo(),
                        tienda.getIdTienda(),
                        tienda.getNombre(),
                        codigoTipoPago,
                        buildDescription(tienda, tipoEntrega, codigoTipoPago),
                        externalReference,
                        null
                )
        );

        return construirRespuesta(checkoutResult);
    }

    /**
     * Crea o reutiliza una sesion externa para pagar solo el saldo de un pedido existente.
     */
    @Transactional(noRollbackFor = ReglaNegocioException.class)
    public CheckoutSessionResponse crearSesionPagoRestante(String correoUsuario, Long idPedido) {
        UsuarioEntity usuario = obtenerUsuarioActivoPorCorreo(correoUsuario);
        PedidoEntity pedido = pedidoRepository
                .findMiPedidoActivoParaActualizar(idPedido, usuario.getIdUsuario())
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el pedido solicitado"));

        validarPedidoDisponibleParaPagoRestante(pedido);

        CheckoutSessionEntity sesionActiva = checkoutSessionRepository
                .findPagoRestanteActivoParaActualizar(
                        pedido.getIdPedido(),
                        CheckoutSessionOperacion.PAGO_RESTANTE.name()
                )
                .orElse(null);

        if (sesionActiva != null) {
            if (tieneUrlRedireccionValida(sesionActiva)) {
                return construirRespuestaSesionActiva(sesionActiva);
            }

            marcarSesionComoError(sesionActiva);
        }

        BigDecimal saldoPendiente = calcularSaldoPendiente(pedido);
        if (saldoPendiente.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ReglaNegocioException("El pedido no tiene saldo pendiente por pagar");
        }

        TipoPagoEntity tipoPagoRestante = obtenerTipoPagoActivoPorCodigo(CODIGO_TIPO_PAGO_RESTANTE);
        PaymentGatewayProvider provider = PaymentGatewayProvider.from(
                paymentGatewayProperties.getDefaultProvider()
        );
        PaymentGatewayRedirectUrls redirectUrls = construirUrlsRetornoPagoRestante(pedido.getIdPedido());
        String externalReference = generarExternalReference(usuario, pedido.getTienda());
        CheckoutSessionEntity checkoutSession = crearSesionPagoRestante(
                pedido,
                tipoPagoRestante,
                provider,
                saldoPendiente,
                externalReference
        );
        checkoutSessionRepository.save(checkoutSession);

        PaymentGatewayCheckoutResult checkoutResult = prepararCheckoutExterno(
                checkoutSession,
                new PaymentGatewayCheckoutCommand(
                        provider,
                        saldoPendiente,
                        paymentGatewayProperties.getCurrency(),
                        usuario.getIdUsuario(),
                        usuario.getCorreo(),
                        pedido.getTienda().getIdTienda(),
                        pedido.getTienda().getNombre(),
                        CODIGO_TIPO_PAGO_RESTANTE,
                        "Pago de saldo pendiente del pedido #" + pedido.getIdPedido(),
                        externalReference,
                        redirectUrls
                )
        );

        return construirRespuesta(checkoutResult);
    }

    private CheckoutSessionEntity crearCheckoutSession(
            UsuarioEntity usuario,
            TiendaEntity tienda,
            TipoEntregaEntity tipoEntrega,
            TipoPagoEntity tipoPago,
            String codigoTipoPago,
            CheckoutSessionRequest request,
            BigDecimal total,
            BigDecimal montoInicial,
            String externalReference
    ) {
        CheckoutSessionEntity session = new CheckoutSessionEntity();
        session.setExternalReference(externalReference);
        session.setProvider(PaymentGatewayProvider.from(request.provider()).name());
        session.setEstadoCheckout(CheckoutSessionEstado.CREADA.name());
        session.setUsuario(usuario);
        session.setTienda(tienda);
        session.setTipoEntrega(tipoEntrega);
        session.setTipoPago(tipoPago);
        session.setCodigoTipoPago(codigoTipoPago);
        session.setTipoOperacion(CheckoutSessionOperacion.PAGO_INICIAL.name());
        session.setFechaEntrega(request.fechaEntrega());
        session.setObservacion(normalizarTextoOpcional(request.observacion()));
        session.setSubtotal(total);
        session.setMontoInicial(montoInicial);
        session.setSaldoRestante(total.subtract(montoInicial).setScale(2, RoundingMode.HALF_UP));
        session.setMoneda(paymentGatewayProperties.getCurrency());

        for (CheckoutItemRequest itemRequest : request.items()) {
            ProductoEntity producto = obtenerProductoActivoParaCheckout(itemRequest.idProducto());
            validarProductoDisponibleParaCheckout(producto, tienda.getIdTienda(), itemRequest.cantidad());
            session.addItem(crearCheckoutSessionItem(producto, itemRequest.cantidad()));
        }

        return session;
    }

    private CheckoutSessionEntity crearSesionPagoRestante(
            PedidoEntity pedido,
            TipoPagoEntity tipoPagoRestante,
            PaymentGatewayProvider provider,
            BigDecimal saldoPendiente,
            String externalReference
    ) {
        CheckoutSessionEntity session = new CheckoutSessionEntity();
        session.setExternalReference(externalReference);
        session.setProvider(provider.name());
        session.setEstadoCheckout(CheckoutSessionEstado.CREADA.name());
        session.setUsuario(pedido.getUsuario());
        session.setTienda(pedido.getTienda());
        session.setTipoEntrega(pedido.getTipoEntrega());
        session.setTipoPago(tipoPagoRestante);
        session.setCodigoTipoPago(CODIGO_TIPO_PAGO_RESTANTE);
        session.setTipoOperacion(CheckoutSessionOperacion.PAGO_RESTANTE.name());
        session.setFechaEntrega(pedido.getFechaEntrega());
        session.setObservacion(pedido.getObservacion());
        session.setSubtotal(pedido.getTotal().setScale(2, RoundingMode.HALF_UP));
        session.setMontoInicial(saldoPendiente.setScale(2, RoundingMode.HALF_UP));
        session.setSaldoRestante(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        session.setMoneda(paymentGatewayProperties.getCurrency());
        session.setPedido(pedido);

        return session;
    }

    private CheckoutSessionItemEntity crearCheckoutSessionItem(
            ProductoEntity producto,
            Integer cantidad
    ) {
        CheckoutSessionItemEntity item = new CheckoutSessionItemEntity();
        item.setProducto(producto);
        item.setNombreProducto(producto.getNombre());
        item.setCantidad(cantidad);
        item.setPrecioUnitario(producto.getPrecio());
        item.setSubtotal(producto.getPrecio()
                .multiply(BigDecimal.valueOf(cantidad))
                .setScale(2, RoundingMode.HALF_UP));

        return item;
    }

    private BigDecimal calcularTotalCheckout(List<CheckoutItemRequest> items, Long idTienda) {
        BigDecimal subtotal = BigDecimal.ZERO;

        for (CheckoutItemRequest item : items) {
            ProductoEntity producto = obtenerProductoActivoParaCheckout(item.idProducto());

            validarProductoDisponibleParaCheckout(producto, idTienda, item.cantidad());

            BigDecimal subtotalDetalle = producto.getPrecio()
                    .multiply(BigDecimal.valueOf(item.cantidad()));

            subtotal = subtotal.add(subtotalDetalle);
        }

        return subtotal.setScale(2, RoundingMode.HALF_UP);
    }

    private UsuarioEntity obtenerUsuarioActivoPorCorreo(String correoUsuario) {
        return usuarioRepository.findByCorreoIgnoreCaseAndEstadoTrue(correoUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontro el usuario autenticado"
                ));
    }

    private TiendaEntity obtenerTiendaActivaPorId(Long idTienda) {
        return tiendaRepository.findByIdTiendaAndEstadoTrue(idTienda)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontro la tienda solicitada"
                ));
    }

    private TipoEntregaEntity obtenerTipoEntregaActivoPorId(Long idTipoEntrega) {
        return tipoEntregaRepository.findByIdTipoEntregaAndEstadoTrue(idTipoEntrega)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontro el tipo de entrega solicitado"
                ));
    }

    private TipoPagoEntity obtenerTipoPagoActivoPorCodigo(String codigoTipoPago) {
        String codigoNormalizado = normalizarCodigo(codigoTipoPago);

        return tipoPagoRepository.findByCodigoAndEstadoTrue(codigoNormalizado)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontro la modalidad de pago solicitada"
                ));
    }

    private ProductoEntity obtenerProductoActivoParaCheckout(Long idProducto) {
        return productoRepository.findByIdProductoAndEstadoTrueAndVisibleEnTiendaTrue(idProducto)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontro el producto solicitado"
                ));
    }

    private void validarTiendaDisponibleParaCompra(TiendaEntity tienda) {
        if (tienda.getEstadoRevision() == null
                || !ESTADO_REVISION_APROBADA.equalsIgnoreCase(tienda.getEstadoRevision())) {
            throw new RecursoNoEncontradoException(
                    "No se encontro la tienda solicitada"
            );
        }
    }

    private void validarUsuarioNoCompraSuPropiaTienda(
            UsuarioEntity usuario,
            TiendaEntity tienda
    ) {
        boolean tiendaPropia = tiendaRepository.existsTiendaPropiaDeUsuario(
                tienda.getIdTienda(),
                usuario.getIdUsuario()
        );

        if (tiendaPropia) {
            throw new ReglaNegocioException(
                    "No puedes realizar pedidos sobre productos de tu propia tienda"
            );
        }
    }

    private void validarTipoPagoInicial(String codigoTipoPago) {
        if (CODIGO_TIPO_PAGO_RESTANTE.equals(codigoTipoPago)) {
            throw new ReglaNegocioException(
                    "El pago restante no puede usarse para crear un checkout"
            );
        }

        if (!CODIGO_TIPO_PAGO_SENA.equals(codigoTipoPago)
                && !CODIGO_TIPO_PAGO_COMPLETO.equals(codigoTipoPago)) {
            throw new ReglaNegocioException(
                    "El tipo de pago inicial debe ser SENA o PAGO_COMPLETO"
            );
        }
    }

    private void validarItemsCheckout(List<CheckoutItemRequest> items) {
        if (items == null || items.isEmpty()) {
            throw new ReglaNegocioException(
                    "El checkout debe tener al menos un producto"
            );
        }

        for (CheckoutItemRequest item : items) {
            if (item.idProducto() == null) {
                throw new ReglaNegocioException(
                        "Cada item del checkout debe tener un producto"
                );
            }

            if (item.cantidad() == null || item.cantidad() <= 0) {
                throw new ReglaNegocioException(
                        "La cantidad de cada producto debe ser mayor a cero"
                );
            }
        }
    }

    private void validarProductosDuplicados(List<CheckoutItemRequest> items) {
        Set<Long> idsProductos = new HashSet<>();

        for (CheckoutItemRequest item : items) {
            if (!idsProductos.add(item.idProducto())) {
                throw new RecursoDuplicadoException(
                        "No puede haber productos repetidos en el checkout"
                );
            }
        }
    }

    private void validarProductoDisponibleParaCheckout(
            ProductoEntity producto,
            Long idTienda,
            Integer cantidadSolicitada
    ) {
        if (!Objects.equals(producto.getTienda().getIdTienda(), idTienda)) {
            throw new RecursoNoEncontradoException(
                    "Uno de los productos no pertenece a la tienda indicada"
            );
        }

        if (!Boolean.TRUE.equals(producto.getVisibleEnTienda())) {
            throw new ReglaNegocioException(
                    "Uno de los productos no esta visible para compra"
            );
        }

        if (producto.getStock() < cantidadSolicitada) {
            throw new ReglaNegocioException(
                    "Stock insuficiente para el producto: " + producto.getNombre()
            );
        }
    }

    private BigDecimal calcularMontoPagoInicial(
            String codigoTipoPago,
            BigDecimal total,
            BigDecimal porcentajeSena
    ) {
        if (CODIGO_TIPO_PAGO_COMPLETO.equals(codigoTipoPago)) {
            return total.setScale(2, RoundingMode.HALF_UP);
        }

        return total.multiply(porcentajeSena)
                .divide(CIEN, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calcularSaldoPendiente(PedidoEntity pedido) {
        BigDecimal montoPagado = pagoRepository.sumarPagosAprobadosPorPedido(pedido.getIdPedido());
        BigDecimal saldo = pedido.getTotal().subtract(montoPagado == null ? BigDecimal.ZERO : montoPagado);

        return saldo.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    private void validarPedidoDisponibleParaPagoRestante(PedidoEntity pedido) {
        if (PedidoEntity.ESTADO_ANULADO.equals(pedido.getEstadoPedido())) {
            throw new ReglaNegocioException("No se puede pagar el saldo de un pedido anulado");
        }
    }

    private String buildDescription(
            TiendaEntity tienda,
            TipoEntregaEntity tipoEntrega,
            String codigoTipoPago
    ) {
        return "Pago inicial %s para reserva en %s con %s".formatted(
                codigoTipoPago,
                tienda.getNombre(),
                tipoEntrega.getNombre()
        );
    }

    private String generarExternalReference(
            UsuarioEntity usuario,
            TiendaEntity tienda
    ) {
        return "REGALIA-U%s-T%s-%s".formatted(
                usuario.getIdUsuario(),
                tienda.getIdTienda(),
                UUID.randomUUID()
        );
    }

    private PaymentGatewayRedirectUrls construirUrlsRetornoPagoRestante(Long idPedido) {
        String baseUrl = paymentGatewayProperties.getClientBaseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new ReglaNegocioException("La URL publica del cliente para pagos no esta configurada");
        }

        String rutaPedido = baseUrl.replaceAll("/+$", "") + "/cliente/pedidos/" + idPedido;

        return new PaymentGatewayRedirectUrls(
                rutaPedido + "?checkout=confirmacion&payment=success",
                rutaPedido + "?checkout=confirmacion&payment=failure",
                rutaPedido + "?checkout=confirmacion&payment=pending"
        );
    }

    private CheckoutSessionResponse construirRespuesta(PaymentGatewayCheckoutResult checkoutResult) {
        return new CheckoutSessionResponse(
                checkoutResult.provider().name(),
                checkoutResult.preferenceId(),
                checkoutResult.externalReference(),
                checkoutResult.amount(),
                checkoutResult.currency(),
                checkoutResult.initPoint(),
                checkoutResult.sandboxInitPoint(),
                checkoutResult.redirectUrl()
        );
    }

    private CheckoutSessionResponse construirRespuestaSesionActiva(CheckoutSessionEntity session) {
        return new CheckoutSessionResponse(
                session.getProvider(),
                session.getPreferenceId(),
                session.getExternalReference(),
                session.getMontoInicial(),
                session.getMoneda(),
                null,
                null,
                session.getRedirectUrl()
        );
    }

    private PaymentGatewayCheckoutResult prepararCheckoutExterno(
            CheckoutSessionEntity checkoutSession,
            PaymentGatewayCheckoutCommand command
    ) {
        try {
            PaymentGatewayCheckoutResult checkoutResult = paymentGatewayRegistry.createCheckout(command);

            if (!StringUtils.hasText(checkoutResult.redirectUrl())) {
                throw new ReglaNegocioException("La pasarela no devolvio una URL de pago valida");
            }

            checkoutSession.setProvider(checkoutResult.provider().name());
            checkoutSession.setPreferenceId(checkoutResult.preferenceId());
            checkoutSession.setRedirectUrl(checkoutResult.redirectUrl());

            return checkoutResult;
        } catch (ReglaNegocioException exception) {
            marcarSesionComoError(checkoutSession);
            throw exception;
        }
    }

    private boolean tieneUrlRedireccionValida(CheckoutSessionEntity checkoutSession) {
        return StringUtils.hasText(checkoutSession.getRedirectUrl());
    }

    private void marcarSesionComoError(CheckoutSessionEntity checkoutSession) {
        checkoutSession.setEstadoCheckout(CheckoutSessionEstado.ERROR.name());
        checkoutSession.setProviderStatusDetail("No se pudo preparar el checkout externo");
        checkoutSessionRepository.saveAndFlush(checkoutSession);
    }

    private String normalizarTextoOpcional(String texto) {
        if (texto == null || texto.isBlank()) {
            return null;
        }

        return texto.trim();
    }

    private String normalizarCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            throw new ReglaNegocioException(
                    "El codigo interno requerido no esta configurado correctamente"
            );
        }

        return codigo.trim().toUpperCase(Locale.ROOT);
    }
}
