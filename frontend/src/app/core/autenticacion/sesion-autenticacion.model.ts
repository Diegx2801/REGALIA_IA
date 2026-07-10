export type RolUsuario = 'CLIENTE' | 'VENDEDOR' | 'ADMIN';

export interface UsuarioSesion {
  idUsuario: number;
  nombreCompleto: string;
  correo: string;
  rol: RolUsuario;
}

export interface SesionAutenticacion {
  token: string;
  usuario: UsuarioSesion;
  expiraEn: number;
}
