export type RolUsuario = 'CLIENTE' | 'VENDEDOR' | 'ADMIN';

export interface UsuarioSesion {
  idUsuario: number;
  nombreCompleto: string;
  correo: string;
  roles: RolUsuario[];
  rol: RolUsuario;
  correoVerificado: boolean;
}

export interface SesionAutenticacion {
  token: string;
  usuario: UsuarioSesion;
  expiraEn: number;
}
