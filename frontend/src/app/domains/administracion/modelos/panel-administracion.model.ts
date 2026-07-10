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
  nombreCompleto: string;
  correo: string;
  verificado: boolean;
  tiendasActivas: number;
  tiendasTotales: number;
  estado: boolean;
}

export interface TiendaAdministracion {
  idTienda: number;
  nombre: string;
  vendedor: string;
  correoVendedor: string;
  estadoRevision: string;
  formalizada: boolean;
  rubros: string[];
  estado: boolean;
}

export interface PedidoAdministracion {
  idPedido: number;
  idUsuario: number;
  nombreTienda: string;
  tipoEntrega: string;
  fechaEntrega: string | null;
  estadoPedido: string;
  total: number;
  montoPagado: number;
  saldoPendiente: number;
  cantidadItems: number;
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
