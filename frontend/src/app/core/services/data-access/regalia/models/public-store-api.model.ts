export interface PublicStoreRubroApiDto {
  idRubro: number;
  nombre: string | null;
}

export interface PublicStoreApiDto {
  idTienda: number;
  nombre: string | null;
  descripcion: string | null;
  direccionReferencia: string | null;
  estadoRevision: string | null;
  tiendaFormalizada: boolean | null;
  rubros: PublicStoreRubroApiDto[] | null;
}

export interface MarketplaceStoreCard {
  id: number;
  businessName: string;
  description: string;
  districtLabel: string;
  reviewStatus: string;
  formalized: boolean;
  categories: string[];
}
