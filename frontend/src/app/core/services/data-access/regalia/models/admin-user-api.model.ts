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

export type AdminUserSortApi =
  | 'idUsuario,asc'
  | 'idUsuario,desc'
  | 'nombre,asc'
  | 'nombre,desc'
  | 'correo,asc'
  | 'fechaCreacion,desc';

export interface AdminUserQueryApi {
  estado?: AdminUserStatusFilterApi;
  searchField?: AdminUserSearchFieldApi;
  search?: string;
  page?: number;
  size?: number;
  sort?: AdminUserSortApi;
}
