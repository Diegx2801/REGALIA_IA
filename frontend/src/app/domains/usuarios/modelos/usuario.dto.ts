export interface UsuarioPerfilDto {
  idUsuario: number;
  nombres: string | null;
  apellidos: string | null;
  correo: string | null;
  telefono: string | null;
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface UsuarioActualizarRequestDto {
  nombres: string;
  apellidos: string;
  telefono: string | null;
}
