import { Producto } from '../../../domains/catalogo/modelos/producto.model';

export interface PasoBuilderIa {
  readonly numero: number;
  readonly titulo: string;
  readonly descripcion: string;
}

export interface SolicitudRecomendacionIa {
  busqueda: string;
}

export interface ResultadoRecomendacionIa {
  respuesta: string;
  productosRecomendados: RecomendacionProductoIa[];
}

export interface RecomendacionProductoIa {
  producto: Producto;
  razon: string;
}
