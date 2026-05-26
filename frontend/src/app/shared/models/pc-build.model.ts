export type PcUseCase = 'gaming' | 'gaming_streaming' | 'design' | 'office' | 'programming';

export type ComponentCategory =
  | 'CPU'
  | 'GPU'
  | 'Motherboard'
  | 'RAM'
  | 'Storage'
  | 'PSU'
  | 'Case'
  | 'Cooling';

export type ValidationStatus = 'ok' | 'warning';

export interface BuildRequirements {
  budget: number;
  useCase: PcUseCase;
  resolution: string;
  streaming: boolean;
  rgb: boolean;
  brandPreference: string;
  notes: string;
}

export interface PcComponent {
  category: ComponentCategory;
  name: string;
  brand: string;
  price: number;
  stock: number;
  attributes: string[];
  reason: string;
}

export interface ValidationCheck {
  label: string;
  detail: string;
  status: ValidationStatus;
}

export interface QuoteSummary {
  storeName: string;
  subtotal: number;
  serviceFee: number;
  total: number;
  estimatedDelivery: string;
}

export interface RecommendedBuild {
  title: string;
  targetExperience: string;
  explanation: string;
  total: number;
  components: PcComponent[];
  checks: ValidationCheck[];
  quote: QuoteSummary;
}
