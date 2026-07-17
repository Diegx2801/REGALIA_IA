import { RolUsuario } from '../../../core/autenticacion/sesion-autenticacion.model';
import {
  AccountIdentityResponseDto,
  GoogleIdentityLinkResponseDto,
  GoogleLoginRequestDto,
  LoginRequestDto,
  LoginResponseDto,
} from '../modelos/autenticacion.dto';
import { CredencialesLogin, IdentidadCuenta, ResultadoLogin } from '../modelos/autenticacion.model';

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
    correoVerificado: dto.correoVerificado,
    roles: dto.roles.map(mapearRolDesdeBackend).filter((rol): rol is RolUsuario => rol !== null),
    contextoAutenticacion: dto.authContext,
    expiraEnMinutos: dto.expiraEnMinutos,
  };
}

export function mapearIdentidadCuentaDesdeDto(dto: AccountIdentityResponseDto): IdentidadCuenta {
  return {
    proveedor: dto.proveedor ?? 'DESCONOCIDO',
    correo: dto.correo ?? 'Correo no disponible',
    correoVerificado: Boolean(dto.correoVerificado),
    vinculada: Boolean(dto.vinculada),
    fechaVinculacion: dto.fechaVinculacion,
  };
}

export function mapearGoogleIdentityLinkDesdeDto(dto: GoogleIdentityLinkResponseDto): IdentidadCuenta {
  return {
    proveedor: dto.proveedor ?? 'GOOGLE',
    correo: dto.correo ?? 'Correo no disponible',
    correoVerificado: true,
    vinculada: Boolean(dto.vinculada),
    fechaVinculacion: null,
  };
}

function mapearRolDesdeBackend(rol: string): RolUsuario | null {
  if (rol === 'CLIENTE') return 'CLIENTE';
  if (rol === 'VENDEDOR') return 'VENDEDOR';
  if (rol === 'ADMIN') return 'ADMIN';
  return null;
}
