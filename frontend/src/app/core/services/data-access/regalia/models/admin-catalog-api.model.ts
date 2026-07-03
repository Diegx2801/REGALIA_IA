export type AdminCatalogType =
  | 'RUBROS'
  | 'TIPOS_PRODUCTO'
  | 'TIPOS_ENTREGA'
  | 'TIPOS_PAGO'
  | 'TIPOS_DOCUMENTO'
  | 'ROLES';

export interface AdminCatalogRawBase {
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface AdminRubroApiDto extends AdminCatalogRawBase {
  idRubro: number;
  nombre: string | null;
  descripcion: string | null;
}

export interface AdminProductTypeApiDto extends AdminCatalogRawBase {
  idTipoProducto: number;
  nombre: string | null;
}

export interface AdminDeliveryTypeApiDto extends AdminCatalogRawBase {
  idTipoEntrega: number;
  nombre: string | null;
}

export interface AdminPaymentTypeApiDto extends AdminCatalogRawBase {
  idTipoPago: number;
  codigo: string | null;
  nombre: string | null;
  descripcion: string | null;
}

export interface AdminDocumentTypeApiDto extends AdminCatalogRawBase {
  idTipoDocumento: number;
  idCategoriaDocumento: number | null;
  categoriaDocumento: string | null;
  nombre: string | null;
  abreviatura: string | null;
  longitudMinima: number | null;
  longitudMaxima: number | null;
}

export interface AdminRoleApiDto extends AdminCatalogRawBase {
  idRol: number;
  nombre: string | null;
}

export interface AdminCatalogItem {
  id: number;
  type: AdminCatalogType;
  name: string;
  description: string;
  primaryMeta: string;
  secondaryMeta: string;
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface AdminCatalogGroup {
  type: AdminCatalogType;
  label: string;
  description: string;
  items: AdminCatalogItem[];
}
