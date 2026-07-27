export interface RubroTiendaPublica {
  idRubro: number;
  nombre: string;
}

export interface TiendaPublica {
  idTienda: number;
  nombre: string;
  descripcion: string;
  direccionReferencia: string;
  tiendaFormalizada: boolean;
  urlLogo: string | null;
  urlPortada: string | null;
  rubros: RubroTiendaPublica[];
  fechaCreacion?: string | null;
}
