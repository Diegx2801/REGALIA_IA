export interface BuilderIaRecomendacionRequestDto {
  busqueda: string;
}

export interface BuilderIaProductoRecomendadoDto {
  idProducto: number;
  nombre: string | null;
  descripcion: string | null;
  precio: number | null;
  stock: number | null;
  idTienda: number;
  nombreTienda: string | null;
  tipoProducto: string | null;
  razon: string | null;
}

export interface BuilderIaRecomendacionResponseDto {
  respuesta: string | null;
  productosRecomendados: BuilderIaProductoRecomendadoDto[] | null;
}
