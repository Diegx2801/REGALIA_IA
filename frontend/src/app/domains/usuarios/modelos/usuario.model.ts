export interface UsuarioPerfil {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  estado: boolean;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface SolicitudActualizarPerfilUsuario {
  nombres: string;
  apellidos: string;
  telefono: string | null;
}
