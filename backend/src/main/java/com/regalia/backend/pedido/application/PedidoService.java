package com.regalia.backend.pedido.application;

import com.regalia.backend.checkout.infrastructure.entity.CheckoutSessionEntity;
import com.regalia.backend.checkout.infrastructure.entity.CheckoutSessionItemEntity;
import com.regalia.backend.comision.infrastructure.entity.ComisionEntity;
import com.regalia.backend.comision.infrastructure.repository.ComisionJpaRepository;
import com.regalia.backend.pago.application.gateway.PaymentGatewayProvider;
import com.regalia.backend.pago.application.gateway.PaymentGatewayRegistry;
import com.regalia.backend.pago.application.gateway.PaymentGatewayStatus;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayVerificationCommand;
import com.regalia.backend.pago.application.gateway.model.PaymentGatewayVerificationResult;
import com.regalia.backend.pago.infrastructure.entity.PagoEntity;
import com.regalia.backend.pago.infrastructure.gateway.PaymentGatewayProperties;
import com.regalia.backend.pago.infrastructure.repository.PagoJpaRepository;
import com.regalia.backend.pedido.api.dto.ConfirmarPedidoRequest;
import com.regalia.backend.pedido.api.dto.OpcionPagoResponse;
import com.regalia.backend.pedido.api.dto.PedidoClienteResumenResponse;
import com.regalia.backend.pedido.api.dto.PedidoDetalleRequest;
import com.regalia.backend.pedido.api.dto.PedidoResponse;
import com.regalia.backend.pedido.api.dto.RegistrarPagoPedidoRequest;
import com.regalia.backend.pedido.infrastructure.entity.DetallePedidoEntity;
import com.regalia.backend.pedido.infrastructure.entity.PedidoEntity;
import com.regalia.backend.pedido.infrastructure.mapper.PedidoMapper;
import com.regalia.backend.pedido.infrastructure.repository.DetallePedidoJpaRepository;
import com.regalia.backend.pedido.infrastructure.repository.PedidoJpaRepository;
import com.regalia.backend.politicacomercial.application.PoliticaComercialService;
import com.regalia.backend.producto.infrastructure.entity.ProductoEntity;
import com.regalia.backend.producto.infrastructure.repository.ProductoJpaRepository;
import com.regalia.backend.shared.exception.RecursoDuplicadoException;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.shared.response.PaginaResponse;
import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import com.regalia.backend.tienda.infrastructure.repository.TiendaJpaRepository;
import com.regalia.backend.tipoentrega.infrastructure.entity.TipoEntregaEntity;
import com.regalia.backend.tipoentrega.infrastructure.repository.TipoEntregaJpaRepository;
import com.regalia.backend.tipopago.infrastructure.entity.TipoPagoEntity;
import com.regalia.backend.tipopago.infrastructure.repository.TipoPagoJpaRepository;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

/**
 * Servicio de aplicación para gestionar pedidos.
 *
 * El carrito no vive en la base de datos. El pedido se registra recién cuando
 * el cliente confirma un pago inicial válido: SENA o PAGO_COMPLETO.
 *
 * Las reglas comerciales variables, como porcentaje de seña y comisión,
 * se obtienen desde PoliticaComercialService para evitar valores hardcodeados.
 */
@Service
@RequiredArgsConstructor
public class PedidoService {

    private static final String CODIGO_TIPO_PAGO_SENA = "SENA";
    private static final String CODIGO_TIPO_PAGO_COMPLETO = "PAGO_COMPLETO";
    private static final String CODIGO_TIPO_PAGO_RESTANTE = "RESTANTE";

    private static final String ESTADO_REVISION_APROBADA = "APROBADA";

    private static final BigDecimal CIEN = new BigDecimal("100.00");
    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 50;

    private final PedidoJpaRepository pedidoRepository;
    private final DetallePedidoJpaRepository detallePedidoRepository;
    private final PagoJpaRepository pagoRepository;
    private final ComisionJpaRepository comisionRepository;
    private final UsuarioJpaRepository usuarioRepository;
    private final TiendaJpaRepository tiendaRepository;
    private final TipoEntregaJpaRepository tipoEntregaRepository;
    private final TipoPagoJpaRepository tipoPagoRepository;
    private final ProductoJpaRepository productoRepository;
    private final PedidoMapper pedidoMapper;
    private final PoliticaComercialService politicaComercialService;
    private final PaymentGatewayRegistry paymentGatewayRegistry;
    private final PaymentGatewayProperties paymentGatewayProperties;

    @Transactional(readOnly = true)
    public List<OpcionPagoResponse> listarOpcionesPagoInicial() {
        TipoPagoEntity tipoPagoSena = obtenerTipoPagoActivoPorCodigo(CODIGO_TIPO_PAGO_SENA);
        TipoPagoEntity tipoPagoCompleto = obtenerTipoPagoActivoPorCodigo(CODIGO_TIPO_PAGO_COMPLETO);

        return List.of(
                pedidoMapper.toOpcionPagoResponse(tipoPagoSena),
                pedidoMapper.toOpcionPagoResponse(tipoPagoCompleto)
        );
    }

    @Transactional
    public PedidoResponse confirmarPedido(String correoUsuario, ConfirmarPedidoRequest request) {
        UsuarioEntity usuario = obtenerUsuarioActivoPorCorreo(correoUsuario);
        TiendaEntity tienda = obtenerTiendaActivaPorId(request.idTienda());

        validarTiendaDisponibleParaCompra(tienda);
        validarUsuarioNoCompraSuPropiaTienda(usuario, tienda);

        TipoEntregaEntity tipoEntrega = obtenerTipoEntregaActivoPorId(request.idTipoEntrega());
        TipoPagoEntity tipoPago = obtenerTipoPagoActivoPorCodigo(request.codigoTipoPago());

        String codigoTipoPago = normalizarCodigo(tipoPago.getCodigo());

        validarTipoPagoInicial(codigoTipoPago);
        validarItemsPedido(request.items());
        validarProductosDuplicados(request.items());

        BigDecimal porcentajeSena = politicaComercialService.obtenerPorcentajeSena();
        BigDecimal porcentajeComision = politicaComercialService.obtenerPorcentajeComision();

        List<DetallePedidoEntity> detalles = new ArrayList<>();
        List<ProductoEntity> productosActualizados = new ArrayList<>();

        BigDecimal subtotal = BigDecimal.ZERO;

        for (PedidoDetalleRequest item : request.items()) {
            ProductoEntity producto = obtenerProductoActivoParaPedido(item.idProducto());

            validarProductoDisponibleParaPedido(
                    producto,
                    tienda.getIdTienda(),
                    item.cantidad()
            );

            BigDecimal subtotalDetalle = producto.getPrecio()
                    .multiply(BigDecimal.valueOf(item.cantidad()));

            subtotal = subtotal.add(subtotalDetalle);

            DetallePedidoEntity detalle = new DetallePedidoEntity();
            detalle.setProducto(producto);
            detalle.setCantidad(item.cantidad());
            detalle.setPrecioUnitario(producto.getPrecio());
            detalle.setEstado(true);

            detalles.add(detalle);

            producto.setStock(producto.getStock() - item.cantidad());
            productosActualizados.add(producto);
        }

        BigDecimal subtotalNormalizado = subtotal.setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subtotalNormalizado;

        BigDecimal montoPagoInicial = calcularMontoPagoInicial(
                codigoTipoPago,
                total,
                porcentajeSena
        );

        PaymentGatewayVerificationResult paymentResult = verifyPayment(
                usuario,
                tienda,
                null,
                codigoTipoPago,
                montoPagoInicial,
                request.metodoPagoPasarela(),
                request.codigoTransaccion()
        );
        validarCodigoTransaccionDisponible(paymentResult.transactionCode());

        PedidoEntity pedido = new PedidoEntity();
        pedido.setUsuario(usuario);
        pedido.setTienda(tienda);
        pedido.setTipoEntrega(tipoEntrega);
        pedido.setFechaEntrega(request.fechaEntrega());
        pedido.setObservacion(normalizarTextoOpcional(request.observacion()));
        pedido.setEstadoPedido(PedidoEntity.ESTADO_RESERVADO);
        pedido.setSubtotal(subtotalNormalizado);
        pedido.setTotal(total);
        pedido.setEstado(true);

        PedidoEntity pedidoGuardado = pedidoRepository.save(pedido);

        detalles.forEach(detalle -> detalle.setPedido(pedidoGuardado));
        List<DetallePedidoEntity> detallesGuardados = detallePedidoRepository.saveAll(detalles);

        productoRepository.saveAll(productosActualizados);

        PagoEntity pago = crearPago(
                pedidoGuardado,
                tipoPago,
                paymentResult
        );

        PagoEntity pagoGuardado = pagoRepository.save(pago);

        ComisionEntity comision = crearComision(pagoGuardado, porcentajeComision);
        comisionRepository.save(comision);

        BigDecimal montoPagado = pagoGuardado.getMonto();
        BigDecimal saldoPendiente = calcularSaldoPendiente(total, montoPagado);

        return pedidoMapper.toResponse(
                pedidoGuardado,
                detallesGuardados,
                montoPagado,
                saldoPendiente
        );
    }

    @Transactional
    public PedidoEntity confirmarPedidoDesdeCheckoutSession(
            CheckoutSessionEntity checkoutSession,
            PaymentGatewayVerificationResult paymentResult
    ) {
        if (checkoutSession.getPedido() != null) {
            return checkoutSession.getPedido();
        }

        if (!PaymentGatewayStatus.APPROVED.equals(paymentResult.status())) {
            throw new ReglaNegocioException(
                    "El pago no fue aprobado por la pasarela"
            );
        }

        validarMontoPagoCheckout(checkoutSession, paymentResult);
        validarCodigoTransaccionDisponible(paymentResult.transactionCode());

        UsuarioEntity usuario = checkoutSession.getUsuario();
        TiendaEntity tienda = checkoutSession.getTienda();
        TipoEntregaEntity tipoEntrega = checkoutSession.getTipoEntrega();
        TipoPagoEntity tipoPago = checkoutSession.getTipoPago();
        String codigoTipoPago = normalizarCodigo(checkoutSession.getCodigoTipoPago());

        validarTiendaDisponibleParaCompra(tienda);
        validarUsuarioNoCompraSuPropiaTienda(usuario, tienda);
        validarTipoPagoInicial(codigoTipoPago);
        validarItemsCheckoutSession(checkoutSession.getItems());

        BigDecimal porcentajeComision = politicaComercialService.obtenerPorcentajeComision();
        List<DetallePedidoEntity> detalles = new ArrayList<>();
        List<ProductoEntity> productosActualizados = new ArrayList<>();

        for (CheckoutSessionItemEntity item : checkoutSession.getItems()) {
            ProductoEntity producto = obtenerProductoActivoParaPedido(item.getProducto().getIdProducto());

            validarProductoDisponibleParaPedido(
                    producto,
                    tienda.getIdTienda(),
                    item.getCantidad()
            );

            DetallePedidoEntity detalle = new DetallePedidoEntity();
            detalle.setProducto(producto);
            detalle.setCantidad(item.getCantidad());
            detalle.setPrecioUnitario(item.getPrecioUnitario());
            detalle.setEstado(true);

            detalles.add(detalle);

            producto.setStock(producto.getStock() - item.getCantidad());
            productosActualizados.add(producto);
        }

        PedidoEntity pedido = new PedidoEntity();
        pedido.setUsuario(usuario);
        pedido.setTienda(tienda);
        pedido.setTipoEntrega(tipoEntrega);
        pedido.setFechaEntrega(checkoutSession.getFechaEntrega());
        pedido.setObservacion(normalizarTextoOpcional(checkoutSession.getObservacion()));
        pedido.setEstadoPedido(PedidoEntity.ESTADO_RESERVADO);
        pedido.setSubtotal(checkoutSession.getSubtotal().setScale(2, RoundingMode.HALF_UP));
        pedido.setTotal(checkoutSession.getSubtotal().setScale(2, RoundingMode.HALF_UP));
        pedido.setEstado(true);

        PedidoEntity pedidoGuardado = pedidoRepository.save(pedido);

        detalles.forEach(detalle -> detalle.setPedido(pedidoGuardado));
        detallePedidoRepository.saveAll(detalles);
        productoRepository.saveAll(productosActualizados);

        PagoEntity pago = crearPago(
                pedidoGuardado,
                tipoPago,
                paymentResult
        );
        PagoEntity pagoGuardado = pagoRepository.save(pago);

        ComisionEntity comision = crearComision(pagoGuardado, porcentajeComision);
        comisionRepository.save(comision);

        return pedidoGuardado;
    }

    @Transactional(readOnly = true)
    public PaginaResponse<PedidoClienteResumenResponse> listarMisPedidos(
            String correoUsuario,
            String q,
            String estado,
            String estadoPago,
            Integer page,
            Integer size,
            String sort
    ) {
        UsuarioEntity usuario = obtenerUsuarioActivoPorCorreo(correoUsuario);
        String busqueda = normalizarBusqueda(q);
        Long idPedidoBuscado = obtenerIdPedidoSiAplica(busqueda);
        PedidoClienteEstadoFiltro filtroEstado = PedidoClienteEstadoFiltro.desde(estado);
        PedidoPagoFiltro filtroPago = PedidoPagoFiltro.desde(estadoPago);
        PedidoClienteSortField sortField = PedidoClienteSortField.desde(sort);
        Sort.Direction sortDirection = PedidoClienteSortField.direccionDesde(sort);
        int pagina = normalizarPagina(page);
        int tamanioPagina = normalizarTamanioPagina(size);

        PageRequest pageable = PageRequest.of(
                pagina,
                tamanioPagina,
                Sort.by(sortDirection, sortField.apiName())
        );

        Page<PedidoClienteResumen> pedidos = pedidoRepository.findPedidosCliente(
                usuario.getIdUsuario(),
                busqueda,
                idPedidoBuscado,
                filtroEstado,
                filtroPago,
                sortField,
                sortDirection,
                pageable
        );

        List<PedidoClienteResumenResponse> contenido = pedidos.getContent()
                .stream()
                .map(this::construirResumenClienteResponse)
                .toList();

        return new PaginaResponse<>(
                contenido,
                pedidos.getNumber(),
                pedidos.getSize(),
                pedidos.getTotalElements(),
                pedidos.getTotalPages(),
                pedidos.isLast()
        );
    }

    @Transactional(readOnly = true)
    public PedidoResponse obtenerMiPedidoPorId(String correoUsuario, Long idPedido) {
        UsuarioEntity usuario = obtenerUsuarioActivoPorCorreo(correoUsuario);

        PedidoEntity pedido = pedidoRepository
                .findByIdPedidoAndUsuarioIdUsuarioAndEstadoTrue(idPedido, usuario.getIdUsuario())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el pedido solicitado"
                ));

        return construirResponse(pedido);
    }

    @Transactional(readOnly = true)
    public PaginaResponse<PedidoResponse> listarPedidosAdmin(
            String estadoPago,
            String searchField,
            String search,
            Integer page,
            Integer size,
            String sort
    ) {
        PedidoPagoFiltro filtroPago = PedidoPagoFiltro.desde(estadoPago);
        PedidoSearchField campoBusqueda = PedidoSearchField.desde(searchField);
        String busqueda = normalizarBusqueda(search);
        Long busquedaId = obtenerBusquedaIdSiAplica(campoBusqueda, busqueda);
        PedidoAdminSortField sortField = PedidoAdminSortField.desde(sort);
        Sort.Direction sortDirection = PedidoAdminSortField.direccionDesde(sort);
        int pagina = normalizarPagina(page);
        int tamanioPagina = normalizarTamanioPagina(size);

        PageRequest pageable = PageRequest.of(
                pagina,
                tamanioPagina,
                Sort.by(sortDirection, sortField.apiName())
        );

        Page<PedidoEntity> pedidos = pedidoRepository.findPedidosAdministracion(
                filtroPago,
                campoBusqueda,
                busqueda,
                busquedaId,
                sortField,
                sortDirection,
                pageable
        );

        List<PedidoResponse> contenido = pedidos.getContent()
                .stream()
                .map(this::construirResponse)
                .toList();

        return new PaginaResponse<>(
                contenido,
                pedidos.getNumber(),
                pedidos.getSize(),
                pedidos.getTotalElements(),
                pedidos.getTotalPages(),
                pedidos.isLast()
        );
    }

    @Transactional(readOnly = true)
    public PedidoResponse obtenerPedidoAdminPorId(Long idPedido) {
        PedidoEntity pedido = pedidoRepository
                .findByIdPedidoAndEstadoTrue(idPedido)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el pedido solicitado"
                ));

        return construirResponse(pedido);
    }

    @Transactional
    public PedidoResponse registrarPagoPedido(
            String correoUsuario,
            Long idPedido,
            RegistrarPagoPedidoRequest request
    ) {
        UsuarioEntity usuario = obtenerUsuarioActivoPorCorreo(correoUsuario);

        PedidoEntity pedido = pedidoRepository
                .findByIdPedidoAndUsuarioIdUsuarioAndEstadoTrue(idPedido, usuario.getIdUsuario())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el pedido solicitado"
                ));

        if (PedidoEntity.ESTADO_ANULADO.equals(pedido.getEstadoPedido())) {
            throw new ReglaNegocioException(
                    "No se puede registrar pagos sobre un pedido anulado"
            );
        }

        BigDecimal montoPagadoActual = obtenerMontoPagadoAprobado(pedido.getIdPedido());
        BigDecimal saldoPendiente = calcularSaldoPendiente(pedido.getTotal(), montoPagadoActual);

        if (saldoPendiente.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ReglaNegocioException(
                    "El pedido no tiene saldo pendiente por pagar"
            );
        }

        TipoPagoEntity tipoPagoRestante = obtenerTipoPagoActivoPorCodigo(CODIGO_TIPO_PAGO_RESTANTE);
        BigDecimal porcentajeComision = politicaComercialService.obtenerPorcentajeComision();

        PaymentGatewayVerificationResult paymentResult = verifyPayment(
                usuario,
                pedido.getTienda(),
                pedido.getIdPedido(),
                CODIGO_TIPO_PAGO_RESTANTE,
                saldoPendiente,
                request.metodoPagoPasarela(),
                request.codigoTransaccion()
        );
        validarCodigoTransaccionDisponible(paymentResult.transactionCode());

        PagoEntity pago = crearPago(
                pedido,
                tipoPagoRestante,
                paymentResult
        );

        PagoEntity pagoGuardado = pagoRepository.save(pago);

        ComisionEntity comision = crearComision(pagoGuardado, porcentajeComision);
        comisionRepository.save(comision);

        BigDecimal montoPagadoFinal = montoPagadoActual.add(pagoGuardado.getMonto())
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal saldoPendienteFinal = calcularSaldoPendiente(pedido.getTotal(), montoPagadoFinal);

        List<DetallePedidoEntity> detalles = detallePedidoRepository
                .findByPedidoIdPedidoAndEstadoTrueOrderByIdDetallePedidoAsc(pedido.getIdPedido());

        return pedidoMapper.toResponse(
                pedido,
                detalles,
                montoPagadoFinal,
                saldoPendienteFinal
        );
    }

    private PedidoResponse construirResponse(PedidoEntity pedido) {
        List<DetallePedidoEntity> detalles = detallePedidoRepository
                .findByPedidoIdPedidoAndEstadoTrueOrderByIdDetallePedidoAsc(pedido.getIdPedido());

        BigDecimal montoPagado = obtenerMontoPagadoAprobado(pedido.getIdPedido());
        BigDecimal saldoPendiente = calcularSaldoPendiente(pedido.getTotal(), montoPagado);

        return pedidoMapper.toResponse(pedido, detalles, montoPagado, saldoPendiente);
    }

    private PedidoClienteResumenResponse construirResumenClienteResponse(PedidoClienteResumen pedido) {
        BigDecimal montoPagado = pedido.montoPagado().setScale(2, RoundingMode.HALF_UP);
        BigDecimal saldoPendiente = calcularSaldoPendiente(pedido.total(), montoPagado);

        return new PedidoClienteResumenResponse(
                pedido.idPedido(),
                pedido.nombreTienda(),
                pedido.tipoEntrega(),
                pedido.fechaEntrega(),
                pedido.estadoPedido(),
                pedido.total().setScale(2, RoundingMode.HALF_UP),
                montoPagado,
                saldoPendiente,
                pedido.fechaCreacion()
        );
    }

    private String normalizarBusqueda(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }

        return valor.trim();
    }

    private Long obtenerBusquedaIdSiAplica(PedidoSearchField campoBusqueda, String busqueda) {
        if (busqueda == null
                || (campoBusqueda != PedidoSearchField.ID_PEDIDO
                && campoBusqueda != PedidoSearchField.ID_USUARIO
                && campoBusqueda != PedidoSearchField.ID_TIENDA)) {
            return null;
        }

        try {
            return Long.valueOf(busqueda);
        } catch (NumberFormatException exception) {
            throw new ReglaNegocioException("El ID de pedido, usuario o tienda debe ser numerico");
        }
    }

    private Long obtenerIdPedidoSiAplica(String busqueda) {
        if (busqueda == null) {
            return null;
        }

        try {
            return Long.valueOf(busqueda);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private int normalizarPagina(Integer page) {
        if (page == null) {
            return DEFAULT_PAGE;
        }

        if (page < 0) {
            throw new ReglaNegocioException("La pagina no puede ser negativa");
        }

        return page;
    }

    private int normalizarTamanioPagina(Integer size) {
        if (size == null) {
            return DEFAULT_PAGE_SIZE;
        }

        if (size < 1) {
            throw new ReglaNegocioException("El tamanio de pagina debe ser mayor a cero");
        }

        if (size > MAX_PAGE_SIZE) {
            throw new ReglaNegocioException("El tamanio maximo permitido por pagina es 50");
        }

        return size;
    }

    private UsuarioEntity obtenerUsuarioActivoPorCorreo(String correoUsuario) {
        return usuarioRepository.findByCorreoIgnoreCaseAndEstadoTrue(correoUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el usuario autenticado"
                ));
    }

    private TiendaEntity obtenerTiendaActivaPorId(Long idTienda) {
        return tiendaRepository.findByIdTiendaAndEstadoTrue(idTienda)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró la tienda solicitada"
                ));
    }

    private TipoEntregaEntity obtenerTipoEntregaActivoPorId(Long idTipoEntrega) {
        return tipoEntregaRepository.findByIdTipoEntregaAndEstadoTrue(idTipoEntrega)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el tipo de entrega solicitado"
                ));
    }

    private TipoPagoEntity obtenerTipoPagoActivoPorCodigo(String codigoTipoPago) {
        String codigoNormalizado = normalizarCodigo(codigoTipoPago);

        return tipoPagoRepository.findByCodigoAndEstadoTrue(codigoNormalizado)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró la modalidad de pago solicitada"
                ));
    }

    private ProductoEntity obtenerProductoActivoParaPedido(Long idProducto) {
        return productoRepository.findActivoParaPedidoPorIdProducto(idProducto)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el producto solicitado"
                ));
    }

    private void validarTiendaDisponibleParaCompra(TiendaEntity tienda) {
        if (tienda.getEstadoRevision() == null
                || !ESTADO_REVISION_APROBADA.equalsIgnoreCase(tienda.getEstadoRevision())) {
            throw new RecursoNoEncontradoException(
                    "No se encontró la tienda solicitada"
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
                    "El pago restante no puede usarse para crear un pedido"
            );
        }

        if (!CODIGO_TIPO_PAGO_SENA.equals(codigoTipoPago)
                && !CODIGO_TIPO_PAGO_COMPLETO.equals(codigoTipoPago)) {
            throw new ReglaNegocioException(
                    "El tipo de pago inicial debe ser SENA o PAGO_COMPLETO"
            );
        }
    }

    private void validarCodigoTransaccionDisponible(String codigoTransaccion) {
        String codigoNormalizado = normalizarTextoObligatorio(
                codigoTransaccion,
                "El código de transacción es obligatorio"
        );

        if (pagoRepository.existsByCodigoTransaccionIgnoreCaseAndEstadoTrue(codigoNormalizado)) {
            throw new RecursoDuplicadoException(
                    "Ya existe un pago registrado con ese código de transacción"
            );
        }
    }

    private void validarMontoPagoCheckout(
            CheckoutSessionEntity checkoutSession,
            PaymentGatewayVerificationResult paymentResult
    ) {
        BigDecimal montoEsperado = checkoutSession.getMontoInicial()
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal montoAprobado = paymentResult.amount()
                .setScale(2, RoundingMode.HALF_UP);

        if (montoEsperado.compareTo(montoAprobado) != 0) {
            throw new ReglaNegocioException(
                    "El monto aprobado no coincide con el checkout solicitado"
            );
        }

        String monedaCheckout = normalizarCodigo(checkoutSession.getMoneda());
        String monedaAprobada = normalizarCodigo(paymentResult.currency());

        if (!monedaCheckout.equals(monedaAprobada)) {
            throw new ReglaNegocioException(
                    "La moneda aprobada no coincide con el checkout solicitado"
            );
        }
    }

    private void validarItemsCheckoutSession(List<CheckoutSessionItemEntity> items) {
        if (items == null || items.isEmpty()) {
            throw new ReglaNegocioException(
                    "El checkout no tiene productos para confirmar"
            );
        }
    }

    private void validarItemsPedido(List<PedidoDetalleRequest> items) {
        if (items == null || items.isEmpty()) {
            throw new ReglaNegocioException(
                    "El pedido debe tener al menos un producto"
            );
        }

        for (PedidoDetalleRequest item : items) {
            if (item.idProducto() == null) {
                throw new ReglaNegocioException(
                        "Cada item del pedido debe tener un producto"
                );
            }

            if (item.cantidad() == null || item.cantidad() <= 0) {
                throw new ReglaNegocioException(
                        "La cantidad de cada producto debe ser mayor a cero"
                );
            }
        }
    }

    private void validarProductosDuplicados(List<PedidoDetalleRequest> items) {
        Set<Long> idsProductos = new HashSet<>();

        for (PedidoDetalleRequest item : items) {
            if (!idsProductos.add(item.idProducto())) {
                throw new RecursoDuplicadoException(
                        "No puede haber productos repetidos en el pedido"
                );
            }
        }
    }

    private void validarProductoDisponibleParaPedido(
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
                    "Uno de los productos no está visible para compra"
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

    private PagoEntity crearPago(
            PedidoEntity pedido,
            TipoPagoEntity tipoPago,
            PaymentGatewayVerificationResult paymentResult
    ) {
        PagoEntity pago = new PagoEntity();
        pago.setPedido(pedido);
        pago.setTipoPago(tipoPago);
        pago.setMonto(paymentResult.amount().setScale(2, RoundingMode.HALF_UP));
        pago.setEstadoPago(toEstadoPago(paymentResult.status()));
        pago.setMetodoPagoPasarela(paymentResult.paymentMethod());
        pago.setCodigoTransaccion(paymentResult.transactionCode());
        pago.setEstado(true);

        return pago;
    }

    private PaymentGatewayVerificationResult verifyPayment(
            UsuarioEntity usuario,
            TiendaEntity tienda,
            Long idPedido,
            String codigoTipoPago,
            BigDecimal amount,
            String paymentMethod,
            String transactionCode
    ) {
        PaymentGatewayProvider provider = PaymentGatewayProvider.from(
                paymentGatewayProperties.getDefaultProvider()
        );

        PaymentGatewayVerificationResult paymentResult = paymentGatewayRegistry.verifyPayment(
                new PaymentGatewayVerificationCommand(
                        provider,
                        paymentMethod,
                        transactionCode,
                        amount,
                        paymentGatewayProperties.getCurrency(),
                        usuario.getIdUsuario(),
                        tienda.getIdTienda(),
                        idPedido,
                        codigoTipoPago
                )
        );

        if (!PaymentGatewayStatus.APPROVED.equals(paymentResult.status())) {
            throw new ReglaNegocioException(
                    "El pago no fue aprobado por la pasarela"
            );
        }

        return paymentResult;
    }

    private String toEstadoPago(PaymentGatewayStatus status) {
        if (PaymentGatewayStatus.APPROVED.equals(status)) {
            return PagoEntity.ESTADO_APROBADO;
        }

        throw new ReglaNegocioException(
                "Solo se registran pagos aprobados en pedidos"
        );
    }

    private ComisionEntity crearComision(
            PagoEntity pago,
            BigDecimal porcentajeComision
    ) {
        BigDecimal montoComision = pago.getMonto()
                .multiply(porcentajeComision)
                .divide(CIEN, 2, RoundingMode.HALF_UP);

        BigDecimal montoNetoVendedor = pago.getMonto()
                .subtract(montoComision)
                .setScale(2, RoundingMode.HALF_UP);

        ComisionEntity comision = new ComisionEntity();
        comision.setPago(pago);
        comision.setPorcentaje(porcentajeComision);
        comision.setMontoComision(montoComision);
        comision.setMontoNetoVendedor(montoNetoVendedor);
        comision.setEstado(true);

        return comision;
    }

    private BigDecimal obtenerMontoPagadoAprobado(Long idPedido) {
        BigDecimal montoPagado = pagoRepository.sumarPagosAprobadosPorPedido(idPedido);

        if (montoPagado == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        return montoPagado.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calcularSaldoPendiente(BigDecimal total, BigDecimal montoPagado) {
        return total.subtract(montoPagado)
                .max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private String normalizarCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            throw new ReglaNegocioException(
                    "El código interno requerido no está configurado correctamente"
            );
        }

        return codigo.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizarTextoObligatorio(String texto, String mensajeError) {
        if (texto == null || texto.isBlank()) {
            throw new ReglaNegocioException(mensajeError);
        }

        return texto.trim();
    }

    private String normalizarTextoOpcional(String texto) {
        if (texto == null || texto.isBlank()) {
            return null;
        }

        return texto.trim();
    }
}
