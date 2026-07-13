export interface ProductoPedidoClienteDto {
  idDetallePedido: number;
  idProducto: number;
  nombreProducto: string | null;
  cantidad: number | null;
  precioUnitario: number | null;
  subtotal: number | null;
}

export interface PedidoClienteDto {
  idPedido: number;
  idUsuario: number;
  idTienda: number;
  nombreTienda: string | null;
  idTipoEntrega: number;
  tipoEntrega: string | null;
  fechaEntrega: string | null;
  observacion: string | null;
  estadoPedido: string | null;
  subtotal: number | null;
  total: number | null;
  montoPagado: number | null;
  saldoPendiente: number | null;
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
  detalles: ProductoPedidoClienteDto[] | null;
}

export interface RegistrarPagoPedidoRequestDto {
  metodoPagoPasarela: string;
  codigoTransaccion: string;
}
