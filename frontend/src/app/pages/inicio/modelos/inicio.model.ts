export interface CampanaComercial {
  readonly fecha: string;
  readonly titulo: string;
  readonly descripcion: string;
  readonly sugerencias: readonly string[];
}

export interface PasoModeloNegocio {
  readonly numero: string;
  readonly descripcion: string;
}
