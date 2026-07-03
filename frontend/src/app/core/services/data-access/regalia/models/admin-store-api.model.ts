export type AdminStoreReviewStatus = 'PENDIENTE' | 'APROBADA' | 'OBSERVADA' | 'RECHAZADA';

export type AdminStoreSearchFieldApi = 'NOMBRE' | 'VENDEDOR' | 'CORREO_VENDEDOR' | 'ID_TIENDA';

export interface AdminStoreQueryApi {
  estadoRevision?: AdminStoreReviewStatus;
  searchField?: AdminStoreSearchFieldApi;
  search?: string;
}

export interface AdminStoreRubroApiDto {
  idRubro: number;
  nombre: string;
}

export interface AdminStoreApiDto {
  idTienda: number;
  idVendedor: number;
  idUsuario: number;
  nombreVendedor: string | null;
  apellidoVendedor: string | null;
  correoVendedor: string | null;
  nombre: string | null;
  descripcion: string | null;
  direccionReferencia: string | null;
  estadoRevision: AdminStoreReviewStatus;
  tiendaFormalizada: boolean | null;
  idDocumentoFiscal: number | null;
  numeroDocumentoFiscal: string | null;
  rubros: AdminStoreRubroApiDto[] | null;
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}
