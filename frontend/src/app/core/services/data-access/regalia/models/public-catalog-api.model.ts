export interface PublicProductImageApiDto {
  urlImagen: string | null;
  orden: number | null;
}

export interface PublicProductApiDto {
  idProducto: number;
  idTienda: number;
  nombreTienda: string | null;
  idTipoProducto: number;
  tipoProducto: string | null;
  nombre: string | null;
  descripcion: string | null;
  precio: number | null;
  stock: number | null;
  imagenes: PublicProductImageApiDto[] | null;
}
