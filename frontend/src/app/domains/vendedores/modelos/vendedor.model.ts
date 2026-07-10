export interface VendedorPerfil {
  idVendedor: number;
  idUsuario: number;
  nombreCompleto: string;
  correo: string;
  verificado: boolean;
  estado: boolean;
  fechaCreacion: string | null;
}

export interface RubroTiendaVendedor {
  idRubro: number;
  nombre: string;
}

export interface TiendaVendedor {
  idTienda: number;
  nombre: string;
  descripcion: string;
  direccionReferencia: string;
  estadoRevision: string;
  formalizada: boolean;
  rubros: RubroTiendaVendedor[];
  estado: boolean;
}

export interface ProductoVendedor {
  idProducto: number;
  idTienda: number;
  nombreTienda: string;
  tipoProducto: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  visibleEnTienda: boolean;
  estado: boolean;
  urlImagen: string;
}

export interface PedidoRecibidoResumen {
  idPedido: number;
  correoCliente: string;
  idTienda: number;
  nombreTienda: string;
  fechaEntrega: string | null;
  estadoPedido: string;
  total: number;
  montoPagado: number;
  saldoPendiente: number;
  cantidadItems: number;
  fechaCreacion: string | null;
}

export interface ProductoPedidoRecibido {
  idDetallePedido: number;
  idProducto: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface PagoPedidoRecibido {
  idPago: number;
  codigoTipoPago: string;
  tipoPago: string;
  monto: number;
  estadoPago: string;
  metodoPagoPasarela: string;
  codigoTransaccion: string;
  fechaCreacion: string | null;
}

export interface PedidoRecibidoDetalle extends PedidoRecibidoResumen {
  tipoEntrega: string;
  observacion: string;
  estado: boolean;
  fechaActualizacion: string | null;
  productos: ProductoPedidoRecibido[];
  pagos: PagoPedidoRecibido[];
}

export interface SolicitudTiendaVendedor {
  nombre: string;
  descripcion: string | null;
  direccionReferencia: string | null;
  idsRubros: number[];
}

export interface SolicitudProductoVendedor {
  idTipoProducto: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  visibleEnTienda: boolean;
  urlImagen: string | null;
}
