export interface UsuarioPerfil {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  correoVerificado: boolean;
  estado: boolean;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface SolicitudActualizarPerfilUsuario {
  nombres: string;
  apellidos: string;
  telefono: string | null;
}

export interface SolicitudCrearUsuario {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  contrasena: string;
}

export interface SolicitudCambioContrasena {
  contrasenaActual: string;
  nuevaContrasena: string;
}
