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

export type MotivoCambioSesion = 'inicio' | 'reemplazo' | 'cierre' | 'expiracion';

export interface CambioIdentidadSesion {
  readonly idUsuarioAnterior: number | null;
  readonly idUsuarioActual: number | null;
  readonly motivo: MotivoCambioSesion;
}
