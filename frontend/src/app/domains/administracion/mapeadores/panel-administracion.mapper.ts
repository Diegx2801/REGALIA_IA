import {
  PedidoAdministracionDto,
  TiendaAdministracionDto,
  UsuarioAdministracionDto,
  VendedorAdministracionDto,
} from '../modelos/panel-administracion.dto';
import {
  PedidoAdministracion,
  TiendaAdministracion,
  UsuarioAdministracion,
  VendedorAdministracion,
} from '../modelos/panel-administracion.model';

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
    estado: Boolean(dto.estado),
    fechaCreacion: dto.fechaCreacion,
  };
}

export function mapearVendedorAdministracionDesdeDto(
  dto: VendedorAdministracionDto,
): VendedorAdministracion {
  const nombres = dto.nombreUsuario?.trim() || 'Vendedor';
  const apellidos = dto.apellidoUsuario?.trim() || 'REGALIA';

  return {
    idVendedor: dto.idVendedor,
    nombreCompleto: `${nombres} ${apellidos}`.trim(),
    correo: dto.correoUsuario?.trim() || 'correo no disponible',
    verificado: Boolean(dto.vendedorVerificado),
    tiendasActivas: Number(dto.cantidadTiendasActivas ?? 0),
    tiendasTotales: Number(dto.cantidadTiendasTotales ?? 0),
    estado: Boolean(dto.estado),
  };
}

export function mapearTiendaAdministracionDesdeDto(
  dto: TiendaAdministracionDto,
): TiendaAdministracion {
  const nombres = dto.nombreVendedor?.trim() || 'Vendedor';
  const apellidos = dto.apellidoVendedor?.trim() || 'REGALIA';

  return {
    idTienda: dto.idTienda,
    nombre: dto.nombre?.trim() || 'Tienda REGALIA',
    vendedor: `${nombres} ${apellidos}`.trim(),
    correoVendedor: dto.correoVendedor?.trim() || 'correo no disponible',
    estadoRevision: dto.estadoRevision?.trim() || 'PENDIENTE',
    formalizada: Boolean(dto.tiendaFormalizada),
    rubros: (dto.rubros ?? []).map((rubro) => rubro.nombre?.trim() || 'Rubro'),
    estado: Boolean(dto.estado),
  };
}

export function mapearPedidoAdministracionDesdeDto(
  dto: PedidoAdministracionDto,
): PedidoAdministracion {
  return {
    idPedido: dto.idPedido,
    idUsuario: dto.idUsuario,
    nombreTienda: dto.nombreTienda?.trim() || 'Tienda REGALIA',
    tipoEntrega: dto.tipoEntrega?.trim() || 'Entrega por coordinar',
    fechaEntrega: dto.fechaEntrega,
    estadoPedido: dto.estadoPedido?.trim() || 'PENDIENTE',
    total: Number(dto.total ?? 0),
    montoPagado: Number(dto.montoPagado ?? 0),
    saldoPendiente: Number(dto.saldoPendiente ?? 0),
    cantidadItems: (dto.detalles ?? []).reduce((total, detalle) => total + Number(detalle.cantidad ?? 0), 0),
  };
}
