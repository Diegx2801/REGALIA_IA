export type RegaliaCategory =
  | 'Cajas sorpresa'
  | 'Arreglos florales'
  | 'Reposteria personalizada'
  | 'Manualidades'
  | 'Sublimados'
  | 'Decoracion de eventos'
  | 'Carpinteria personalizada'
  | 'Servicios creativos';

export type RegaliaOccasion =
  | 'Cumpleanos'
  | 'Graduacion'
  | 'San Valentin'
  | 'Dia de la Madre'
  | 'Navidad'
  | 'Aniversario'
  | 'Evento corporativo';

export type OrderStatus = 'Pedido aceptado' | 'En proceso' | 'Listo' | 'Entregado';

export interface ReviewSummary {
  quality: number;
  punctuality: number;
  communication: number;
  presentation: number;
  value: number;
}

export interface RegaliaProvider {
  id: number;
  businessName: string;
  ownerName: string;
  category: RegaliaCategory;
  district: string;
  whatsapp: string;
  priceFrom: number;
  priceTo: number;
  deliveryTime: string;
  availability: string;
  paymentMethods: string[];
  styles: string[];
  occasions: RegaliaOccasion[];
  rating: number;
  reviews: number;
  reputation: number;
  distanceKm: number;
  featured: boolean;
  portfolio: string[];
  description: string;
  reviewSummary: ReviewSummary;
}

export interface RegaliaRequest {
  need: string;
  occasion: RegaliaOccasion;
  budget: number;
  style: string;
  deliveryDate: string;
  district: string;
  urgent: boolean;
}

export interface ReservationBreakdown {
  estimatedOrder: number;
  reservation: number;
  platformCommission: number;
  providerCredit: number;
}

export interface MatchRecommendation {
  provider: RegaliaProvider;
  score: number;
  reason: string;
  interpretedNeed: {
    category: RegaliaCategory;
    occasion: RegaliaOccasion;
    style: string;
    urgency: string;
    budgetFit: string;
  };
  reservation: ReservationBreakdown;
}

export interface RegaliaOrder {
  id: number;
  clientName: string;
  providerName: string;
  category: RegaliaCategory;
  occasion: RegaliaOccasion;
  status: OrderStatus;
  total: number;
  reservation: number;
  commission: number;
  dueDate: string;
}

export interface ProviderFilter {
  search: string;
  category: RegaliaCategory | 'Todas';
  occasion: RegaliaOccasion | 'Todas';
  maxPrice: number;
  availableOnly: boolean;
}
