export type EstadoDocumentoAdministracion =
  'PENDIENTE' | 'VERIFICADO' | 'OBSERVADO' | 'RECHAZADO' | 'DESCONOCIDO';

export interface DocumentoAdministracion {
  readonly idDocumento: number;
  readonly idUsuario: number;
  readonly nombreCompleto: string;
  readonly correo: string;
  readonly tipoDocumento: string;
  readonly abreviatura: string;
  readonly categoria: string;
  readonly numeroDocumento: string;
  readonly estadoVerificacion: EstadoDocumentoAdministracion;
  readonly activo: boolean;
  readonly fechaCreacion: string;
  readonly fechaActualizacion: string | null;
}
