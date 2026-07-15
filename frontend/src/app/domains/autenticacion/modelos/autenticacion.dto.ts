export interface LoginRequestDto {
  correo: string;
  contrasena: string;
}

export interface GoogleLoginRequestDto {
  idToken: string;
}

export interface AccountIdentityResponseDto {
  proveedor: string | null;
  correo: string | null;
  correoVerificado: boolean | null;
  vinculada: boolean | null;
  fechaVinculacion: string | null;
}

export interface GoogleIdentityLinkResponseDto {
  proveedor: string | null;
  correo: string | null;
  vinculada: boolean | null;
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
