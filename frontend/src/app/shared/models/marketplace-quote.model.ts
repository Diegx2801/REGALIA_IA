import { PcComponent } from './pc-build.model';

export type QuoteHighlight = 'Mejor balance' | 'Mas economica' | 'Mejor garantia' | 'Entrega rapida';

export interface MarketplaceStore {
  id: number;
  name: string;
  district: string;
  rating: number;
  reviews: number;
  warranty: string;
  deliveryTime: string;
  responseTime: string;
}

export interface MarketplaceQuote {
  id: number;
  highlight: QuoteHighlight;
  store: MarketplaceStore;
  buildName: string;
  target: string;
  total: number;
  stockStatus: 'Completo' | 'Reservable';
  score: number;
  scoreBreakdown: {
    price: number;
    stock: number;
    reputation: number;
    warranty: number;
    delivery: number;
  };
  components: PcComponent[];
  explanation: string;
}
