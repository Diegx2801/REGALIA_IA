export interface RubroTiendaPublicaDto {
  idRubro: number;
  nombre: string | null;
}

export interface TiendaPublicaDto {
  idTienda: number;
  nombre: string | null;
  descripcion: string | null;
  direccionReferencia: string | null;
  tiendaFormalizada: boolean | null;
  urlLogo: string | null;
  urlPortada: string | null;
  rubros: RubroTiendaPublicaDto[] | null;
  fechaCreacion?: string | null;
}
