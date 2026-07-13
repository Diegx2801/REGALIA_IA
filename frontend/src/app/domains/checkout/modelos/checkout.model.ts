export interface ItemSolicitudCheckout {
  idProducto: number;
  cantidad: number;
}

export interface SolicitudCheckout {
  proveedor: string;
  idTienda: number;
  idTipoEntrega: number;
  codigoTipoPago: string;
  fechaEntrega: string;
  observacion: string | null;
  items: ItemSolicitudCheckout[];
}

export interface ResultadoCheckout {
  proveedor: string;
  referenciaExterna: string | null;
  monto: number;
  moneda: string;
  urlRedireccion: string | null;
}

export interface OpcionPagoInicial {
  codigo: string;
  nombre: string;
  descripcion: string | null;
}
