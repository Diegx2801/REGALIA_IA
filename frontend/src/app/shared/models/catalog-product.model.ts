import { ComponentCategory } from './pc-build.model';

export interface CatalogProduct {
  id: number;
  category: ComponentCategory;
  name: string;
  brand: string;
  price: number;
  previousPrice?: number;
  stock: number;
  imageTone: string;
  attributes: Record<string, string>;
  compatibilityTags: string[];
  shortDescription: string;
  storeName: string;
  rating: number;
  reviews: number;
  discountLabel?: string;
  shippingLabel: string;
  warrantyLabel: string;
  sellerBadge: string;
}

export interface CatalogFilters {
  search: string;
  category: ComponentCategory | 'All';
  brand: string;
  stockOnly: boolean;
  maxPrice: number;
}
