import { UsuarioActualizarRequestDto, UsuarioPerfilDto } from '../modelos/usuario.dto';
import { SolicitudActualizarPerfilUsuario, UsuarioPerfil } from '../modelos/usuario.model';

export function mapearUsuarioPerfilDesdeDto(dto: UsuarioPerfilDto): UsuarioPerfil {
  const nombres = dto.nombres?.trim() || 'Cliente';
  const apellidos = dto.apellidos?.trim() || 'REGALIA';

  return {
    idUsuario: dto.idUsuario,
    nombres,
    apellidos,
    nombreCompleto: `${nombres} ${apellidos}`.trim(),
    correo: dto.correo?.trim() || 'correo no disponible',
    telefono: dto.telefono?.trim() || 'Telefono pendiente',
    estado: Boolean(dto.estado),
    fechaCreacion: dto.fechaCreacion,
    fechaActualizacion: dto.fechaActualizacion,
  };
}

export function mapearSolicitudActualizarPerfilADto(
  solicitud: SolicitudActualizarPerfilUsuario,
): UsuarioActualizarRequestDto {
  return {
    nombres: solicitud.nombres,
    apellidos: solicitud.apellidos,
    telefono: solicitud.telefono,
  };
}
