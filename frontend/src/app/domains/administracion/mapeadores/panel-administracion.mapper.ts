import {
  PedidoAdministracionDto,
  ProductoCatalogoTiendaAdministracionDto,
  TiendaAdministracionDto,
  UsuarioAdministracionDto,
  VendedorAdministracionDto,
} from '../modelos/panel-administracion.dto';
import {
  PedidoAdministracion,
  ProductoCatalogoTiendaAdministracion,
  TiendaAdministracion,
  UsuarioAdministracion,
  VendedorAdministracion,
} from '../modelos/panel-administracion.model';

export function mapearProductoCatalogoTiendaAdministracionDesdeDto(
  dto: ProductoCatalogoTiendaAdministracionDto,
): ProductoCatalogoTiendaAdministracion {
  return {
    idProducto: dto.idProducto,
    nombre: dto.nombre?.trim() || 'Producto REGALIA',
    tipoProducto: dto.tipoProducto?.trim() || 'Tipo pendiente',
    descripcion: dto.descripcion?.trim() || 'Sin descripción registrada.',
    precio: Number(dto.precio ?? 0),
    stock: Number(dto.stock ?? 0),
  };
}

export function mapearUsuarioAdministracionDesdeDto(
  dto: UsuarioAdministracionDto,
): UsuarioAdministracion {
  const nombres = dto.nombres?.trim() || 'Usuario';
  const apellidos = dto.apellidos?.trim() || 'REGALIA';

  return {
    idUsuario: dto.idUsuario,
    nombreCompleto: `${nombres} ${apellidos}`.trim(),
    correo: dto.correo?.trim() || 'correo no disponible',
    telefono: dto.telefono?.trim() || 'Telefono pendiente',
    correoVerificado: Boolean(dto.correoVerificado),
    estado: Boolean(dto.estado),
    fechaCreacion: dto.fechaCreacion,
    fechaActualizacion: dto.fechaActualizacion,
  };
}

export function mapearVendedorAdministracionDesdeDto(
  dto: VendedorAdministracionDto,
): VendedorAdministracion {
  const nombres = dto.nombreUsuario?.trim() || 'Vendedor';
  const apellidos = dto.apellidoUsuario?.trim() || 'REGALIA';

  return {
    idVendedor: dto.idVendedor,
    idUsuario: dto.idUsuario,
    nombreCompleto: `${nombres} ${apellidos}`.trim(),
    correo: dto.correoUsuario?.trim() || 'correo no disponible',
    verificado: Boolean(dto.vendedorVerificado),
    tiendasActivas: Number(dto.cantidadTiendasActivas ?? 0),
    tiendasTotales: Number(dto.cantidadTiendasTotales ?? 0),
    estado: Boolean(dto.estado),
    fechaCreacion: dto.fechaCreacion,
    fechaActualizacion: dto.fechaActualizacion,
  };
}

export function mapearTiendaAdministracionDesdeDto(
  dto: TiendaAdministracionDto,
): TiendaAdministracion {
  const nombres = dto.nombreVendedor?.trim() || 'Vendedor';
  const apellidos = dto.apellidoVendedor?.trim() || 'REGALIA';

  return {
    idTienda: dto.idTienda,
    idVendedor: dto.idVendedor,
    idUsuario: dto.idUsuario,
    nombre: dto.nombre?.trim() || 'Tienda REGALIA',
    descripcion: dto.descripcion?.trim() || 'Sin descripción registrada.',
    direccionReferencia: dto.direccionReferencia?.trim() || 'Dirección pendiente',
    vendedor: `${nombres} ${apellidos}`.trim(),
    correoVendedor: dto.correoVendedor?.trim() || 'correo no disponible',
    estadoRevision: dto.estadoRevision?.trim() || 'PENDIENTE',
    formalizada: Boolean(dto.tiendaFormalizada),
    idDocumentoFiscal: dto.idDocumentoFiscal,
    numeroDocumentoFiscal: dto.numeroDocumentoFiscal?.trim() || null,
    rubros: (dto.rubros ?? []).map((rubro) => rubro.nombre?.trim() || 'Rubro'),
    estado: Boolean(dto.estado),
    fechaCreacion: dto.fechaCreacion,
    fechaActualizacion: dto.fechaActualizacion,
  };
}

export function mapearPedidoAdministracionDesdeDto(
  dto: PedidoAdministracionDto,
): PedidoAdministracion {
  const productos = (dto.detalles ?? []).map((detalle) => ({
    idDetallePedido: detalle.idDetallePedido,
    idProducto: detalle.idProducto,
    nombre: detalle.nombreProducto?.trim() || 'Producto REGALIA',
    cantidad: Number(detalle.cantidad ?? 0),
    precioUnitario: Number(detalle.precioUnitario ?? 0),
    subtotal: Number(detalle.subtotal ?? 0),
  }));

  return {
    idPedido: dto.idPedido,
    idUsuario: dto.idUsuario,
    idTienda: dto.idTienda,
    nombreTienda: dto.nombreTienda?.trim() || 'Tienda REGALIA',
    tipoEntrega: dto.tipoEntrega?.trim() || 'Entrega por coordinar',
    fechaEntrega: dto.fechaEntrega,
    observacion: dto.observacion?.trim() || 'Sin observaciones registradas.',
    estadoPedido: dto.estadoPedido?.trim() || 'PENDIENTE',
    subtotal: Number(dto.subtotal ?? 0),
    total: Number(dto.total ?? 0),
    montoPagado: Number(dto.montoPagado ?? 0),
    saldoPendiente: Number(dto.saldoPendiente ?? 0),
    cantidadItems: productos.reduce((total, producto) => total + producto.cantidad, 0),
    productos,
    estado: Boolean(dto.estado),
    fechaCreacion: dto.fechaCreacion,
    fechaActualizacion: dto.fechaActualizacion,
  };
}
