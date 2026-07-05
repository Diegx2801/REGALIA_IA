export type RegaliaCategory =
  | 'Cajas sorpresa'
  | 'Arreglos florales'
  | 'Repostería personalizada'
  | 'Manualidades'
  | 'Sublimados'
  | 'Decoración de eventos'
  | 'Carpintería personalizada'
  | 'Servicios creativos';

export type RegaliaOccasion =
  | 'Cumpleaños'
  | 'Día de la Madre'
  | 'Aniversario'
  | 'Graduación'
  | 'San Valentín'
  | 'Navidad'
  | 'Condolencias'
  | 'Evento corporativo';

export type OrderStatus = 'Pedido aceptado' | 'En proceso' | 'Listo' | 'Entregado';

export interface ReviewSummary {
  quality: number;
  punctuality: number;
  communication: number;
  presentation: number;
  value: number;
}

export interface OccasionShortcut {
  id: string;
  label: string;
  route: string;
  icon: 'gift' | 'heart' | 'ring' | 'cap' | 'leaf' | 'grid';
}

export interface FeaturedProduct {
  id: number;
  title: string;
  seller: string;
  sellerCategory: RegaliaCategory;
  priceFrom: number;
  rating: number;
  reviews: number;
  imageUrl: string;
  imagePosition: string;
  verified: boolean;
}

export interface FixedPriceProduct {
  id: number;
  title: string;
  seller: string;
  sellerId: number;
  sellerCategory: RegaliaCategory;
  occasion: RegaliaOccasion;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  imageUrl: string;
  imagePosition: string;
  verified: boolean;
  badges: string[];
  shortDescription: string;
  description: string;
  includes: string[];
  deliveryTime: string;
  stockStatus: string;
  personalization: string;
  maxQuantity: number;
}

export interface CartItem {
  product: FixedPriceProduct;
  quantity: number;
}

export interface CartSummary {
  subtotal: number;
  reservation: number;
  platformCommission: number;
  sellerAdvance: number;
  remainingToPay: number;
  totalItems: number;
}

export interface RegaliaSeller {
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
  sellerCredit: number;
}

export interface MatchRecommendation {
  seller: RegaliaSeller;
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
  sellerName: string;
  category: RegaliaCategory;
  occasion: RegaliaOccasion;
  status: OrderStatus;
  total: number;
  reservation: number;
  commission: number;
  dueDate: string;
}

export interface SellerFilter {
  search: string;
  category: RegaliaCategory | 'Todas';
  occasion: RegaliaOccasion | 'Todas';
  maxPrice: number;
  availableOnly: boolean;
}

export interface AdminMetric {
  label: string;
  value: string;
  hint: string;
}
