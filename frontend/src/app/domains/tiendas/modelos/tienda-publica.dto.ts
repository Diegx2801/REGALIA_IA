export interface RubroTiendaPublicaDto {
  idRubro: number;
  nombre: string | null;
}

export interface TiendaPublicaDto {
  idTienda: number;
  nombre: string | null;
  descripcion: string | null;
  direccionReferencia: string | null;
  estadoRevision: string | null;
  tiendaFormalizada: boolean | null;
  rubros: RubroTiendaPublicaDto[] | null;
  fechaCreacion?: string | null;
}
