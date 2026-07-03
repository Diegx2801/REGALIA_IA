export interface AdminSellerApiDto {
  idVendedor: number;
  idUsuario: number;
  nombreUsuario: string | null;
  apellidoUsuario: string | null;
  correoUsuario: string | null;
  vendedorVerificado: boolean | null;
  cantidadTiendasActivas: number | null;
  cantidadTiendasTotales: number | null;
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export type AdminSellerStatusFilterApi = 'TODOS' | 'ACTIVO' | 'INACTIVO';
export type AdminSellerVerificationFilterApi = 'TODOS' | 'VERIFICADO' | 'SIN_VERIFICAR';
export type AdminSellerSearchFieldApi = 'NOMBRE' | 'CORREO' | 'ID_VENDEDOR' | 'ID_USUARIO';

export interface AdminSellerQueryApi {
  estado?: AdminSellerStatusFilterApi;
  verificacion?: AdminSellerVerificationFilterApi;
  searchField?: AdminSellerSearchFieldApi;
  search?: string;
}
