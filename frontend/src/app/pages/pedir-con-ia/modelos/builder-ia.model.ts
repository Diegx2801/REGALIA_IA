import { Producto } from '../../../domains/catalogo/modelos/producto.model';

export interface SolicitudRecomendacionIa {
  busqueda: string;
}

export interface ResultadoRecomendacionIa {
  respuesta: string;
  productosRecomendados: Producto[];
}
