export interface UsuarioAdministracionDto {
  idUsuario: number;
  nombres: string | null;
  apellidos: string | null;
  correo: string | null;
  telefono: string | null;
  correoVerificado: boolean | null;
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface VendedorAdministracionDto {
  idVendedor: number;
  idUsuario: number;
  nombreUsuario: string | null;
  apellidoUsuario: string | null;
  correoUsuario: string | null;
  vendedorVerificado: boolean | null;
  cantidadTiendasActivas: number | null;
  cantidadTiendasTotales: number | null;
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface RubroTiendaAdministracionDto {
  idRubro: number;
  nombre: string | null;
}

export interface TiendaAdministracionDto {
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
  rubros: RubroTiendaAdministracionDto[] | null;
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface ProductoCatalogoTiendaAdministracionDto {
  idProducto: number;
  idTienda: number;
  nombreTienda: string | null;
  idTipoProducto: number;
  tipoProducto: string | null;
  nombre: string | null;
  descripcion: string | null;
  precio: number | null;
  stock: number | null;
}

export interface DetallePedidoAdministracionDto {
  idDetallePedido: number;
  idProducto: number;
  nombreProducto: string | null;
  cantidad: number | null;
  precioUnitario: number | null;
  subtotal: number | null;
}

export interface PedidoAdministracionDto {
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
  detalles: DetallePedidoAdministracionDto[] | null;
}
