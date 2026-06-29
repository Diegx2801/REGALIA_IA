export interface DeliveryTypeApiDto {
  idTipoEntrega: number;
  nombre: string;
  estado: boolean;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface InitialPaymentOptionApiDto {
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export interface ConfirmOrderItemApiDto {
  idProducto: number;
  cantidad: number;
}

export interface ConfirmOrderApiRequest {
  idTienda: number;
  idTipoEntrega: number;
  codigoTipoPago: string;
  fechaEntrega: string;
  observacion: string | null;
  metodoPagoPasarela: string;
  codigoTransaccion: string;
  items: ConfirmOrderItemApiDto[];
}

export interface OrderDetailApiDto {
  idDetallePedido: number;
  idProducto: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface OrderApiDto {
  idPedido: number;
  idUsuario: number;
  idTienda: number;
  nombreTienda: string;
  idTipoEntrega: number;
  tipoEntrega: string;
  fechaEntrega: string;
  observacion: string | null;
  estadoPedido: string;
  subtotal: number;
  total: number;
  montoPagado: number;
  saldoPendiente: number;
  estado: boolean;
  fechaCreacion: string;
  fechaActualizacion: string | null;
  detalles: OrderDetailApiDto[];
}
