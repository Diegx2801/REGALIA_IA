export interface VendedorPerfilDto {
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

export interface RubroTiendaVendedorDto {
  idRubro: number;
  nombre: string | null;
}

export interface TiendaVendedorDto {
  idTienda: number;
  idVendedor: number;
  idUsuario: number;
  nombreVendedor: string | null;
  apellidoVendedor: string | null;
  correoVendedor: string | null;
  nombre: string | null;
  descripcion: string | null;
  direccionReferencia: string | null;
  estadoRevision: string | null;
  tiendaFormalizada: boolean | null;
  idDocumentoFiscal: number | null;
  numeroDocumentoFiscal: string | null;
  rubros: RubroTiendaVendedorDto[] | null;
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface ImagenProductoVendedorDto {
  idProductoImagen: number;
  urlImagen: string | null;
  orden: number | null;
}

export interface CargaImagenProductoDto {
  claveTemporal: string;
  urlCarga: string;
  cabecerasRequeridas: Record<string, string>;
  expiraEn: string;
}

export interface ProductoVendedorDto {
  idProducto: number;
  idTienda: number;
  nombreTienda: string | null;
  idTipoProducto: number;
  tipoProducto: string | null;
  nombre: string | null;
  descripcion: string | null;
  precio: number | null;
  stock: number | null;
  visibleEnTienda: boolean | null;
  imagenes: ImagenProductoVendedorDto[] | null;
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface PedidoRecibidoResumenDto {
  idPedido: number;
  idCliente: number;
  correoCliente: string | null;
  idTienda: number;
  nombreTienda: string | null;
  fechaEntrega: string | null;
  estadoPedido: string | null;
  total: number | null;
  montoPagado: number | null;
  saldoPendiente: number | null;
  cantidadItems: number | null;
  fechaCreacion: string | null;
}

export interface ProductoPedidoRecibidoDto {
  idDetallePedido: number;
  idProducto: number;
  nombreProducto: string | null;
  cantidad: number | null;
  precioUnitario: number | null;
  subtotal: number | null;
}

export interface PagoPedidoRecibidoDto {
  idPago: number;
  codigoTipoPago: string | null;
  tipoPago: string | null;
  monto: number | null;
  estadoPago: string | null;
  metodoPagoPasarela: string | null;
  codigoTransaccion: string | null;
  fechaCreacion: string | null;
}

export interface PedidoRecibidoDetalleDto extends PedidoRecibidoResumenDto {
  idTipoEntrega: number;
  tipoEntrega: string | null;
  observacion: string | null;
  estado: boolean | null;
  fechaActualizacion: string | null;
  detalles: ProductoPedidoRecibidoDto[] | null;
  pagos: PagoPedidoRecibidoDto[] | null;
}

export interface TiendaVendedorRequestDto {
  nombre: string;
  descripcion: string | null;
  direccionReferencia: string | null;
  idDocumentoFiscal: number | null;
  idsRubros: number[];
}

export interface ProductoVendedorRequestDto {
  idTipoProducto: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  visibleEnTienda: boolean;
}
