import {
  FixedPriceProduct,
  RegaliaCategory,
  RegaliaOccasion,
  RegaliaProvider,
  RegaliaRequest,
  ReservationBreakdown,
} from '../../../shared/models/regalia.model';

export type FaseBuilder = 'need' | 'interpretation' | 'recommendations' | 'reservation';

export type EstadoCargaBuilder = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface PasoBuilder {
  phase: FaseBuilder;
  label: string;
  description: string;
}

export interface SugerenciaRapidaBuilder {
  label: string;
  imageUrl: string;
  need: string;
  occasion: RegaliaRequest['occasion'];
  style: string;
}

export interface VistaPreviaSolicitudBuilder {
  description: string;
  occasion: string;
  budget: number;
  style: string;
  deliveryDate: string;
  district: string;
  urgent: boolean;
}

export interface InterpretacionBuilder {
  category: RegaliaCategory;
  occasion: RegaliaOccasion;
  style: string;
  urgency: string;
  budgetFit: string;
}

export interface RecomendacionProductoBuilder {
  producto: FixedPriceProduct;
  proveedor: RegaliaProvider | null;
  puntaje: number;
  motivo: string;
  interpretacion: InterpretacionBuilder;
  reserva: ReservationBreakdown;
}

export interface ResultadoRecomendacionesBuilder {
  estado: EstadoCargaBuilder;
  recomendaciones: RecomendacionProductoBuilder[];
  mensaje: string | null;
}
