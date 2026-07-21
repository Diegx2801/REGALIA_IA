export interface RubroTiendaPublica {
  idRubro: number;
  nombre: string;
}

export interface TiendaPublica {
  idTienda: number;
  nombre: string;
  descripcion: string;
  direccionReferencia: string;
  estadoRevision: string;
  tiendaFormalizada: boolean;
  rubros: RubroTiendaPublica[];
  fechaCreacion?: string | null;
}
