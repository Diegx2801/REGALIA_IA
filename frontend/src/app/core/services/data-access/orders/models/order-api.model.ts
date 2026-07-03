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

export type AdminOrderPaymentFilterApi = 'TODOS' | 'PAGADO' | 'CON_SALDO';
export type AdminOrderSearchFieldApi =
  | 'ID_PEDIDO'
  | 'NOMBRE_TIENDA'
  | 'ID_USUARIO'
  | 'ID_TIENDA'
  | 'ESTADO_PEDIDO';
export type AdminOrderSortApi =
  | 'fechaCreacion,desc'
  | 'fechaCreacion,asc'
  | 'idPedido,desc'
  | 'idPedido,asc'
  | 'fechaEntrega,desc'
  | 'fechaEntrega,asc'
  | 'total,desc'
  | 'total,asc'
  | 'saldoPendiente,desc'
  | 'saldoPendiente,asc'
  | 'nombreTienda,asc'
  | 'nombreTienda,desc';

export interface AdminOrderQueryApi {
  estadoPago?: AdminOrderPaymentFilterApi;
  searchField?: AdminOrderSearchFieldApi;
  search?: string;
  page?: number;
  size?: number;
  sort?: AdminOrderSortApi;
}
