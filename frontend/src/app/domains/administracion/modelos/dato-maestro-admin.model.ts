export type TipoDatoMaestroAdmin =
  'RUBRO' | 'TIPO_PRODUCTO' | 'TIPO_ENTREGA' | 'TIPO_PAGO' | 'TIPO_DOCUMENTO';

export interface ConfiguracionDatoMaestroAdmin {
  readonly tipo: TipoDatoMaestroAdmin;
  readonly etiqueta: string;
}

export const CONFIGURACIONES_DATOS_MAESTROS: readonly ConfiguracionDatoMaestroAdmin[] = [
  { tipo: 'RUBRO', etiqueta: 'Rubros' },
  { tipo: 'TIPO_PRODUCTO', etiqueta: 'Tipos de producto' },
  { tipo: 'TIPO_ENTREGA', etiqueta: 'Tipos de entrega' },
  { tipo: 'TIPO_PAGO', etiqueta: 'Tipos de pago' },
  { tipo: 'TIPO_DOCUMENTO', etiqueta: 'Tipos de documento' },
];

export interface DatoMaestroAdmin {
  readonly id: number;
  readonly tipo: TipoDatoMaestroAdmin;
  readonly categoria: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly estado: boolean;
  readonly codigo: string | null;
  readonly abreviatura: string | null;
  readonly idCategoriaDocumento: number | null;
  readonly categoriaDocumento: string | null;
  readonly longitudMinima: number | null;
  readonly longitudMaxima: number | null;
  readonly fechaCreacion: string | null;
  readonly fechaActualizacion: string | null;
}

export function obtenerConfiguracionDatoMaestro(
  tipo: TipoDatoMaestroAdmin,
): ConfiguracionDatoMaestroAdmin {
  return CONFIGURACIONES_DATOS_MAESTROS.find((configuracion) => configuracion.tipo === tipo)!;
}
