export interface ItemCarrito {
  idProducto: number;
  idTienda: number;
  nombre: string;
  nombreTienda: string;
  tipoProducto: string;
  precioUnitario: number;
  cantidad: number;
  stockDisponible: number;
  urlImagen: string;
  observacion: string | null;
}
