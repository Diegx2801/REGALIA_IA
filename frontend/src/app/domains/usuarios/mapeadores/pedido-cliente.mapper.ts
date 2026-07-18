import { PedidoClienteDto, PedidoClienteResumenDto } from '../modelos/pedido-cliente.dto';
import { PedidoCliente, PedidoClienteResumen } from '../modelos/pedido-cliente.model';

export function mapearPedidoClienteDesdeDto(dto: PedidoClienteDto): PedidoCliente {
  return {
    idPedido: dto.idPedido,
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
    estado: Boolean(dto.estado),
    fechaCreacion: dto.fechaCreacion,
    fechaActualizacion: dto.fechaActualizacion,
    productos: (dto.detalles ?? []).map((detalle) => ({
      idDetallePedido: detalle.idDetallePedido,
      idProducto: detalle.idProducto,
      nombreProducto: detalle.nombreProducto?.trim() || 'Producto REGALIA',
      cantidad: Number(detalle.cantidad ?? 0),
      precioUnitario: Number(detalle.precioUnitario ?? 0),
      subtotal: Number(detalle.subtotal ?? 0),
    })),
  };
}

export function mapearPedidoClienteResumenDesdeDto(
  dto: PedidoClienteResumenDto,
): PedidoClienteResumen {
  return {
    idPedido: dto.idPedido,
    nombreTienda: dto.nombreTienda?.trim() || 'Tienda REGALIA',
    tipoEntrega: dto.tipoEntrega?.trim() || 'Entrega por coordinar',
    fechaEntrega: dto.fechaEntrega,
    estadoPedido: dto.estadoPedido?.trim() || 'PENDIENTE',
    total: Number(dto.total ?? 0),
    montoPagado: Number(dto.montoPagado ?? 0),
    saldoPendiente: Number(dto.saldoPendiente ?? 0),
    fechaCreacion: dto.fechaCreacion,
  };
}
