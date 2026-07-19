import {
  PedidoRecibidoDetalleDto,
  PedidoRecibidoResumenDto,
  ProductoVendedorRequestDto,
  ProductoVendedorDto,
  TiendaVendedorRequestDto,
  TiendaVendedorDto,
  VendedorPerfilDto,
} from '../modelos/vendedor.dto';
import {
  PedidoRecibidoDetalle,
  PedidoRecibidoResumen,
  ProductoVendedor,
  SolicitudProductoVendedor,
  SolicitudTiendaVendedor,
  TiendaVendedor,
  VendedorPerfil,
} from '../modelos/vendedor.model';

const IMAGEN_PRODUCTO_FALLBACK = '/assets/brand/producto-fallback.svg';

export function mapearPerfilVendedorDesdeDto(dto: VendedorPerfilDto): VendedorPerfil {
  const nombre = [dto.nombreUsuario, dto.apellidoUsuario]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    idVendedor: dto.idVendedor,
    idUsuario: dto.idUsuario,
    nombreCompleto: nombre || 'Vendedor REGALIA',
    correo: dto.correoUsuario?.trim() || 'correo no disponible',
    verificado: Boolean(dto.vendedorVerificado),
    estado: Boolean(dto.estado),
    fechaCreacion: dto.fechaCreacion,
  };
}

export function mapearTiendaVendedorDesdeDto(dto: TiendaVendedorDto): TiendaVendedor {
  return {
    idTienda: dto.idTienda,
    nombre: dto.nombre?.trim() || 'Tienda REGALIA',
    descripcion: dto.descripcion?.trim() || 'Sin descripcion comercial registrada.',
    direccionReferencia: dto.direccionReferencia?.trim() || 'Direccion pendiente',
    estadoRevision: dto.estadoRevision?.trim() || 'PENDIENTE',
    formalizada: Boolean(dto.tiendaFormalizada),
    idDocumentoFiscal: dto.idDocumentoFiscal,
    rubros: (dto.rubros ?? []).map((rubro) => ({
      idRubro: rubro.idRubro,
      nombre: rubro.nombre?.trim() || 'Rubro',
    })),
    estado: Boolean(dto.estado),
  };
}

export function mapearProductoVendedorDesdeDto(dto: ProductoVendedorDto): ProductoVendedor {
  const imagen = (dto.imagenes ?? [])
    .filter((item) => Boolean(item.urlImagen?.trim()))
    .sort((actual, siguiente) => (actual.orden ?? 0) - (siguiente.orden ?? 0))[0];

  return {
    idProducto: dto.idProducto,
    idTienda: dto.idTienda,
    nombreTienda: dto.nombreTienda?.trim() || 'Tienda REGALIA',
    idTipoProducto: dto.idTipoProducto,
    tipoProducto: dto.tipoProducto?.trim() || 'Producto personalizado',
    nombre: dto.nombre?.trim() || 'Producto REGALIA',
    descripcion: dto.descripcion?.trim() || 'Sin descripcion registrada.',
    precio: Number(dto.precio ?? 0),
    stock: Number(dto.stock ?? 0),
    visibleEnTienda: Boolean(dto.visibleEnTienda),
    estado: Boolean(dto.estado),
    urlImagen: imagen?.urlImagen?.trim() || IMAGEN_PRODUCTO_FALLBACK,
  };
}

export function mapearPedidoRecibidoDesdeDto(dto: PedidoRecibidoResumenDto): PedidoRecibidoResumen {
  return {
    idPedido: dto.idPedido,
    correoCliente: dto.correoCliente?.trim() || 'cliente no disponible',
    idTienda: dto.idTienda,
    nombreTienda: dto.nombreTienda?.trim() || 'Tienda REGALIA',
    fechaEntrega: dto.fechaEntrega,
    estadoPedido: dto.estadoPedido?.trim() || 'PENDIENTE',
    total: Number(dto.total ?? 0),
    montoPagado: Number(dto.montoPagado ?? 0),
    saldoPendiente: Number(dto.saldoPendiente ?? 0),
    cantidadItems: Number(dto.cantidadItems ?? 0),
    fechaCreacion: dto.fechaCreacion,
  };
}

export function mapearPedidoRecibidoDetalleDesdeDto(
  dto: PedidoRecibidoDetalleDto,
): PedidoRecibidoDetalle {
  return {
    ...mapearPedidoRecibidoDesdeDto(dto),
    tipoEntrega: dto.tipoEntrega?.trim() || 'Entrega por coordinar',
    observacion: dto.observacion?.trim() || 'Sin observaciones del cliente.',
    estado: Boolean(dto.estado),
    fechaActualizacion: dto.fechaActualizacion,
    productos: (dto.detalles ?? []).map((detalle) => ({
      idDetallePedido: detalle.idDetallePedido,
      idProducto: detalle.idProducto,
      nombreProducto: detalle.nombreProducto?.trim() || 'Producto REGALIA',
      cantidad: Number(detalle.cantidad ?? 0),
      precioUnitario: Number(detalle.precioUnitario ?? 0),
      subtotal: Number(detalle.subtotal ?? 0),
    })),
    pagos: (dto.pagos ?? []).map((pago) => ({
      idPago: pago.idPago,
      codigoTipoPago: pago.codigoTipoPago?.trim() || 'SIN_CODIGO',
      tipoPago: pago.tipoPago?.trim() || 'Pago no especificado',
      monto: Number(pago.monto ?? 0),
      estadoPago: pago.estadoPago?.trim() || 'PENDIENTE',
      metodoPagoPasarela: pago.metodoPagoPasarela?.trim() || 'Sin pasarela',
      codigoTransaccion: pago.codigoTransaccion?.trim() || 'Sin transaccion',
      fechaCreacion: pago.fechaCreacion,
    })),
  };
}

export function mapearSolicitudTiendaADto(
  solicitud: SolicitudTiendaVendedor,
): TiendaVendedorRequestDto {
  return {
    nombre: solicitud.nombre,
    descripcion: solicitud.descripcion,
    direccionReferencia: solicitud.direccionReferencia,
    idDocumentoFiscal: solicitud.idDocumentoFiscal ?? null,
    idsRubros: solicitud.idsRubros,
  };
}

export function mapearSolicitudProductoADto(
  solicitud: SolicitudProductoVendedor,
): ProductoVendedorRequestDto {
  const urlImagen = solicitud.urlImagen?.trim();

  return {
    idTipoProducto: solicitud.idTipoProducto,
    nombre: solicitud.nombre,
    descripcion: solicitud.descripcion,
    precio: solicitud.precio,
    stock: solicitud.stock,
    visibleEnTienda: solicitud.visibleEnTienda,
    imagenes: urlImagen ? [{ urlImagen, orden: 1 }] : null,
  };
}
