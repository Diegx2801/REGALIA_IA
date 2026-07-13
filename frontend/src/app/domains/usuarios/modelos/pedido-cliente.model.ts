export interface ProductoPedidoCliente {
  idDetallePedido: number;
  idProducto: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface PedidoCliente {
  idPedido: number;
  idTienda: number;
  nombreTienda: string;
  tipoEntrega: string;
  fechaEntrega: string | null;
  observacion: string;
  estadoPedido: string;
  subtotal: number;
  total: number;
  montoPagado: number;
  saldoPendiente: number;
  estado: boolean;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
  productos: ProductoPedidoCliente[];
}

export interface SolicitudRegistrarPagoPedido {
  metodoPagoPasarela: string;
  codigoTransaccion: string;
}
