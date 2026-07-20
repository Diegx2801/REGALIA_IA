export interface UsuarioAdministracion {
  idUsuario: number;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  estado: boolean;
  fechaCreacion: string | null;
}

export interface VendedorAdministracion {
  idVendedor: number;
  idUsuario: number;
  nombreCompleto: string;
  correo: string;
  verificado: boolean;
  tiendasActivas: number;
  tiendasTotales: number;
  estado: boolean;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface TiendaAdministracion {
  idTienda: number;
  idVendedor: number;
  idUsuario: number;
  nombre: string;
  descripcion: string;
  direccionReferencia: string;
  vendedor: string;
  correoVendedor: string;
  estadoRevision: string;
  formalizada: boolean;
  idDocumentoFiscal: number | null;
  numeroDocumentoFiscal: string | null;
  rubros: string[];
  estado: boolean;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface ProductoPedidoAdministracion {
  idDetallePedido: number;
  idProducto: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface PedidoAdministracion {
  idPedido: number;
  idUsuario: number;
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
  cantidadItems: number;
  productos: ProductoPedidoAdministracion[];
  estado: boolean;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface ResumenAdministracion {
  totalUsuarios: number;
  totalVendedores: number;
  totalTiendas: number;
  totalPedidos: number;
  totalProductosVisibles: number;
  tiendasPendientes: number;
  pedidosConSaldo: number;
  montoPagado: number;
}
