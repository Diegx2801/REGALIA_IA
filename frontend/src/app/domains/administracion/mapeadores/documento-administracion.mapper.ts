import { DocumentoAdministracionDto } from '../modelos/documento-administracion.dto';
import {
  DocumentoAdministracion,
  EstadoDocumentoAdministracion,
} from '../modelos/documento-administracion.model';

export function mapearDocumentoAdministracion(
  dto: DocumentoAdministracionDto,
): DocumentoAdministracion {
  return {
    idDocumento: dto.idUsuarioDocumento,
    idUsuario: dto.idUsuario,
    nombreCompleto:
      `${dto.nombreUsuario ?? ''} ${dto.apellidoUsuario ?? ''}`.trim() || 'Usuario sin nombre',
    correo: dto.correoUsuario,
    tipoDocumento: dto.tipoDocumento,
    abreviatura: dto.abreviatura,
    categoria: dto.categoriaDocumento,
    numeroDocumento: dto.numeroDocumento,
    estadoVerificacion: normalizarEstado(dto.estadoVerificacion),
    activo: Boolean(dto.estado),
    fechaCreacion: dto.fechaCreacion,
    fechaActualizacion: dto.fechaActualizacion,
  };
}

function normalizarEstado(estado: string): EstadoDocumentoAdministracion {
  if (
    estado === 'PENDIENTE' ||
    estado === 'VERIFICADO' ||
    estado === 'OBSERVADO' ||
    estado === 'RECHAZADO'
  )
    return estado;
  return 'DESCONOCIDO';
}
