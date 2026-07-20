export interface UsuarioDocumentoDto {
  idUsuarioDocumento: number;
  idTipoDocumento: number;
  tipoDocumento: string | null;
  abreviatura: string | null;
  idCategoriaDocumento: number;
  categoriaDocumento: string | null;
  numeroDocumento: string | null;
  estadoVerificacion: string | null;
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface ConsultaRucDto {
  ruc: string | null;
  razonSocial: string | null;
  nombreComercial: string | null;
  estado: string | null;
  condicion: string | null;
  direccion: string | null;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
}

export interface UsuarioDocumentoRequestDto {
  idTipoDocumento: number;
  numeroDocumento: string;
}

export interface RegistrarRucRequestDto {
  numeroRuc: string;
}
