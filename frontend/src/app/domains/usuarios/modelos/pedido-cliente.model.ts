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

export interface PedidoClienteResumen {
  idPedido: number;
  nombreTienda: string;
  tipoEntrega: string;
  fechaEntrega: string | null;
  estadoPedido: string;
  total: number;
  montoPagado: number;
  saldoPendiente: number;
  fechaCreacion: string | null;
}

const ETIQUETAS_ESTADO_PEDIDO_CLIENTE: Record<string, string> = {
  RESERVADO: 'Reservado',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo para entrega',
  ENTREGADO: 'Entregado',
  ANULADO: 'Anulado',
};

export function obtenerEtiquetaEstadoPedidoCliente(estado: string): string {
  return ETIQUETAS_ESTADO_PEDIDO_CLIENTE[estado] ?? estado;
}
