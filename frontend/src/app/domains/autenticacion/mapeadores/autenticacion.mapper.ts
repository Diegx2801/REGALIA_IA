import { RolUsuario } from '../../../core/autenticacion/sesion-autenticacion.model';
import { GoogleLoginRequestDto, LoginRequestDto, LoginResponseDto } from '../modelos/autenticacion.dto';
import { CredencialesLogin, ResultadoLogin } from '../modelos/autenticacion.model';

export function mapearCredencialesLoginADto(credenciales: CredencialesLogin): LoginRequestDto {
  return {
    correo: credenciales.correo.trim().toLowerCase(),
    contrasena: credenciales.contrasena,
  };
}

export function mapearGoogleLoginADto(idToken: string): GoogleLoginRequestDto {
  return { idToken };
}

export function mapearLoginDesdeDto(dto: LoginResponseDto): ResultadoLogin {
  return {
    token: dto.token,
    tipoToken: dto.tipo,
    idUsuario: dto.idUsuario,
    correo: dto.correo,
    roles: dto.roles.map(mapearRolDesdeBackend).filter((rol): rol is RolUsuario => rol !== null),
    contextoAutenticacion: dto.authContext,
    expiraEnMinutos: dto.expiraEnMinutos,
  };
}

function mapearRolDesdeBackend(rol: string): RolUsuario | null {
  if (rol === 'CLIENTE') return 'CLIENTE';
  if (rol === 'VENDEDOR') return 'VENDEDOR';
  if (rol === 'ADMIN') return 'ADMIN';
  return null;
}
