export interface AdminUserApiDto {
  idUsuario: number;
  nombres: string | null;
  apellidos: string | null;
  correo: string | null;
  telefono: string | null;
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export type AdminUserStatusFilterApi = 'TODOS' | 'ACTIVO' | 'INACTIVO';

export type AdminUserSearchFieldApi = 'NOMBRE' | 'CORREO' | 'TELEFONO' | 'ID_USUARIO';

export interface AdminUserQueryApi {
  estado?: AdminUserStatusFilterApi;
  searchField?: AdminUserSearchFieldApi;
  search?: string;
}
