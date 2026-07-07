export interface SellerProfileApiDto {
  idVendedor: number;
  idUsuario: number;
  nombreUsuario: string | null;
  apellidoUsuario: string | null;
  correoUsuario: string | null;
  vendedorVerificado: boolean | null;
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface SellerStoreRubroApiDto {
  idRubro: number;
  nombre: string;
}

export type SellerStoreReviewStatus = 'PENDIENTE' | 'APROBADA' | 'OBSERVADA' | 'RECHAZADA';

export interface SellerStoreApiDto {
  idTienda: number;
  idVendedor: number;
  idUsuario: number;
  nombreVendedor: string | null;
  apellidoVendedor: string | null;
  correoVendedor: string | null;
  nombre: string | null;
  descripcion: string | null;
  direccionReferencia: string | null;
  estadoRevision: SellerStoreReviewStatus;
  tiendaFormalizada: boolean | null;
  idDocumentoFiscal: number | null;
  numeroDocumentoFiscal: string | null;
  rubros: SellerStoreRubroApiDto[] | null;
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface SellerProductImageApiDto {
  idImagenProducto: number;
  urlImagen: string | null;
  textoAlternativo: string | null;
  principal: boolean | null;
  orden: number | null;
}

export interface SellerProductApiDto {
  idProducto: number;
  idTienda: number;
  nombreTienda: string | null;
  idTipoProducto: number;
  tipoProducto: string | null;
  nombre: string | null;
  descripcion: string | null;
  precio: number;
  stock: number;
  visibleEnTienda: boolean | null;
  imagenes: SellerProductImageApiDto[] | null;
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface SellerOrderSummaryApiDto {
  idPedido: number;
  idCliente: number;
  correoCliente: string | null;
  idTienda: number;
  nombreTienda: string | null;
  fechaEntrega: string | null;
  estadoPedido: string | null;
  total: number;
  montoPagado: number;
  saldoPendiente: number;
  cantidadItems: number;
  fechaCreacion: string | null;
}

export interface SellerOrderProductApiDto {
  idProducto: number;
  nombreProducto: string | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface SellerOrderPaymentApiDto {
  idPago: number;
  metodoPagoPasarela: string | null;
  codigoTransaccion: string | null;
  monto: number;
  estadoPago: string | null;
  fechaCreacion: string | null;
}

export interface SellerOrderDetailApiDto {
  idPedido: number;
  idCliente: number;
  correoCliente: string | null;
  idTienda: number;
  nombreTienda: string | null;
  idTipoEntrega: number;
  tipoEntrega: string | null;
  fechaEntrega: string | null;
  observacion: string | null;
  estadoPedido: string | null;
  subtotal: number;
  total: number;
  montoPagado: number;
  saldoPendiente: number;
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
  detalles: SellerOrderProductApiDto[] | null;
  pagos: SellerOrderPaymentApiDto[] | null;
}
