import {
  FixedPriceProduct,
  RegaliaCategory,
  RegaliaOccasion,
  RegaliaSeller,
  ReservationBreakdown,
} from '../../../../shared/models/regalia.model';

export type FaseBuilder = 'necesidad' | 'interpretacion' | 'recomendaciones' | 'reserva';

export type EstadoCargaConstructor = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface PasoConstructor {
  fase: FaseBuilder;
  etiqueta: string;
  descripcion: string;
}

export interface SugerenciaRapidaConstructor {
  etiqueta: string;
  urlImagen: string;
  necesidad: string;
}

export interface VistaPreviaSolicitudConstructor {
  descripcion: string;
}

export interface SolicitudBuilderIAConstructor {
  busqueda: string;
}

export interface InterpretacionConstructor {
  categoria: RegaliaCategory;
  ocasion: RegaliaOccasion;
  estilo: string;
  urgencia: string;
  ajustePresupuesto: string;
}

export interface RecomendacionProductoConstructor {
  producto: FixedPriceProduct;
  vendedor: RegaliaSeller | null;
  puntaje: number;
  motivo: string;
  interpretacion: InterpretacionConstructor;
  reserva: ReservationBreakdown;
}

export interface ResultadoRecomendacionesConstructor {
  estado: EstadoCargaConstructor;
  recomendaciones: RecomendacionProductoConstructor[];
  mensaje: string | null;
}

export interface BuilderIAProductoBackend {
  idProducto: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  idTienda: number;
  nombreTienda: string;
  tipoProducto: string;
}

export interface BuilderIARecomendacionBackend {
  respuesta: string;
  productosRecomendados: BuilderIAProductoBackend[];
}

export interface ApiResponse<T> {
  status: 'success' | 'fail' | 'error';
  data: T | null;
  message: string | null;
}
