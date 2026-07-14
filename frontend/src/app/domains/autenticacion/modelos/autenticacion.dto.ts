export interface LoginRequestDto {
  correo: string;
  contrasena: string;
}

export interface GoogleLoginRequestDto {
  idToken: string;
}

export interface LoginResponseDto {
  token: string;
  tipo: string;
  idUsuario: number;
  correo: string;
  roles: string[];
  authContext: 'PUBLIC' | 'ADMIN';
  expiraEnMinutos: number;
}
