export type UserRole = 'Cliente' | 'Vendedor' | 'Administrador';
export type BackendRole = 'CLIENTE' | 'VENDEDOR' | 'ADMIN';
export type AuthContext = 'PUBLIC' | 'ADMIN';

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  idUsuario: number;
  correo: string;
  roles: BackendRole[];
  authContext: AuthContext;
  expiraEnMinutos: number;
}

export interface RegisterRequest {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  contrasena: string;
}

export interface UserResponse {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  estado: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string | null;
}

export interface SessionUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  roles: UserRole[];
  token: string;
  tokenType: string;
  expiresAt: number;
  authContext: AuthContext;
}
