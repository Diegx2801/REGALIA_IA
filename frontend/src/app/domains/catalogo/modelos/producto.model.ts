export interface ImagenProducto {
  urlImagen: string;
  orden: number;
}

export interface Producto {
  idProducto: number;
  idTienda: number;
  nombreTienda: string;
  idTipoProducto: number;
  tipoProducto: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagenes: ImagenProducto[];
  disponible: boolean;
}
