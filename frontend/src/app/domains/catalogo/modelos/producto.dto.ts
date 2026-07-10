export interface ImagenProductoPublicoDto {
  urlImagen: string | null;
  orden: number | null;
}

export interface ProductoPublicoDto {
  idProducto: number;
  idTienda: number;
  nombreTienda: string | null;
  idTipoProducto: number;
  tipoProducto: string | null;
  nombre: string | null;
  descripcion: string | null;
  precio: number | null;
  stock: number | null;
  imagenes: ImagenProductoPublicoDto[] | null;
}
