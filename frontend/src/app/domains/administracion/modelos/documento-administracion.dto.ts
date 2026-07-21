export interface DocumentoAdministracionDto {
  readonly idUsuarioDocumento: number;
  readonly idUsuario: number;
  readonly nombreUsuario: string;
  readonly apellidoUsuario: string;
  readonly correoUsuario: string;
  readonly idTipoDocumento: number;
  readonly tipoDocumento: string;
  readonly abreviatura: string;
  readonly idCategoriaDocumento: number;
  readonly categoriaDocumento: string;
  readonly numeroDocumento: string;
  readonly estadoVerificacion: string;
  readonly estado: boolean;
  readonly fechaCreacion: string;
  readonly fechaActualizacion: string | null;
}
