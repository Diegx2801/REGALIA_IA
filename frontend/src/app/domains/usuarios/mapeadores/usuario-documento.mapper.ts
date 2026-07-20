import {
  ConsultaRucDto,
  UsuarioDocumentoDto,
  UsuarioDocumentoRequestDto,
} from '../modelos/usuario-documento.dto';
import {
  ConsultaRuc,
  EstadoVerificacionDocumento,
  SolicitudRegistrarDocumento,
  UsuarioDocumento,
} from '../modelos/usuario-documento.model';

const ESTADOS_VERIFICACION: EstadoVerificacionDocumento[] = [
  'PENDIENTE',
  'VERIFICADO',
  'OBSERVADO',
  'RECHAZADO',
];

export function mapearUsuarioDocumentoDesdeDto(dto: UsuarioDocumentoDto): UsuarioDocumento {
  return {
    idUsuarioDocumento: dto.idUsuarioDocumento,
    idTipoDocumento: dto.idTipoDocumento,
    tipoDocumento: dto.tipoDocumento?.trim() || 'Documento',
    abreviatura: dto.abreviatura?.trim().toUpperCase() || 'DOC',
    idCategoriaDocumento: dto.idCategoriaDocumento,
    categoriaDocumento: dto.categoriaDocumento?.trim() || 'Documento personal',
    numeroDocumento: dto.numeroDocumento?.trim() || 'No disponible',
    estadoVerificacion: normalizarEstadoVerificacion(dto.estadoVerificacion),
    estado: Boolean(dto.estado),
    fechaCreacion: dto.fechaCreacion,
    fechaActualizacion: dto.fechaActualizacion,
  };
}

export function mapearConsultaRucDesdeDto(dto: ConsultaRucDto): ConsultaRuc {
  const ubicacion = [dto.distrito, dto.provincia, dto.departamento]
    .map((valor) => valor?.trim())
    .filter((valor): valor is string => Boolean(valor))
    .join(', ');

  return {
    ruc: dto.ruc?.trim() || '',
    razonSocial: dto.razonSocial?.trim() || 'Razón social no disponible',
    nombreComercial: dto.nombreComercial?.trim() || null,
    estado: dto.estado?.trim() || 'No informado',
    condicion: dto.condicion?.trim() || 'No informada',
    direccion: dto.direccion?.trim() || 'Dirección no disponible',
    ubicacion: ubicacion || 'Ubicación no disponible',
  };
}

export function mapearSolicitudRegistrarDocumentoADto(
  solicitud: SolicitudRegistrarDocumento,
): UsuarioDocumentoRequestDto {
  return {
    idTipoDocumento: solicitud.idTipoDocumento,
    numeroDocumento: normalizarNumeroDocumento(solicitud.numeroDocumento),
  };
}

export function normalizarNumeroDocumento(numeroDocumento: string): string {
  return numeroDocumento.trim().toUpperCase();
}

function normalizarEstadoVerificacion(estado: string | null): EstadoVerificacionDocumento {
  const estadoNormalizado = estado?.trim().toUpperCase() as EstadoVerificacionDocumento | undefined;
  return estadoNormalizado && ESTADOS_VERIFICACION.includes(estadoNormalizado)
    ? estadoNormalizado
    : 'DESCONOCIDO';
}
