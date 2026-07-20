export interface TipoDocumentoDto {
  idTipoDocumento: number;
  idCategoriaDocumento: number;
  categoriaDocumento: string | null;
  nombre: string | null;
  abreviatura: string | null;
  longitudMinima: number | null;
  longitudMaxima: number | null;
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}
