export interface VerificacionCorreoResponseDto {
  idUsuario: number;
  correo: string;
  verificado: boolean;
}

export interface ConfirmarVerificacionCorreoRequestDto {
  token: string;
}
