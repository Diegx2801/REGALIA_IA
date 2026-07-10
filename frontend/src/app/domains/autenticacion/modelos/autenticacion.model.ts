import { RolUsuario } from '../../../core/autenticacion/sesion-autenticacion.model';

export interface CredencialesLogin {
  correo: string;
  contrasena: string;
}

export interface ResultadoLogin {
  token: string;
  tipoToken: string;
  idUsuario: number;
  correo: string;
  roles: RolUsuario[];
  contextoAutenticacion: 'PUBLIC' | 'ADMIN';
  expiraEnMinutos: number;
}
