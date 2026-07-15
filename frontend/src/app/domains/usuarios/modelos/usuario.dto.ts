export interface UsuarioPerfilDto {
  idUsuario: number;
  nombres: string | null;
  apellidos: string | null;
  correo: string | null;
  telefono: string | null;
  correoVerificado: boolean | null;
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface UsuarioActualizarRequestDto {
  nombres: string;
  apellidos: string;
  telefono: string | null;
}

export interface UsuarioCrearRequestDto {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  contrasena: string;
}
