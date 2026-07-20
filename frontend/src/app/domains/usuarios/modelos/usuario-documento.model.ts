export type EstadoVerificacionDocumento =
  'PENDIENTE' | 'VERIFICADO' | 'OBSERVADO' | 'RECHAZADO' | 'DESCONOCIDO';

export interface UsuarioDocumento {
  idUsuarioDocumento: number;
  idTipoDocumento: number;
  tipoDocumento: string;
  abreviatura: string;
  idCategoriaDocumento: number;
  categoriaDocumento: string;
  numeroDocumento: string;
  estadoVerificacion: EstadoVerificacionDocumento;
  estado: boolean;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface ConsultaRuc {
  ruc: string;
  razonSocial: string;
  nombreComercial: string | null;
  estado: string;
  condicion: string;
  direccion: string;
  ubicacion: string;
}

export interface SolicitudRegistrarDocumento {
  idTipoDocumento: number;
  numeroDocumento: string;
}
