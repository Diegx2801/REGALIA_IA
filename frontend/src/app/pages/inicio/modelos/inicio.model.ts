export interface CategoriaInicio {
  readonly etiqueta: string;
  readonly tipoIcono: 'cuadro' | 'circulo' | 'anillo' | 'tarjeta' | 'hoja' | 'mas';
  readonly busqueda?: string;
}

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
