export type IconoRegalia =
  'accesorio' | 'floral' | 'box' | 'comestible' | 'fisico' | 'personalizado';

export interface CampanaComercial {
  readonly dia: number;
  readonly mes: string;
  readonly fecha: string;
  readonly titulo: string;
  readonly descripcion: string;
  readonly sugerencias: readonly string[];
  readonly icono: IconoRegalia;
}

export interface PasoModeloNegocio {
  readonly numero: string;
  readonly descripcion: string;
}
