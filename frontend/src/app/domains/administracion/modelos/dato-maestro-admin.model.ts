export type TipoDatoMaestroAdmin =
  'RUBRO' | 'TIPO_PRODUCTO' | 'TIPO_ENTREGA' | 'TIPO_PAGO' | 'TIPO_DOCUMENTO';

export interface ConfiguracionDatoMaestroAdmin {
  readonly tipo: TipoDatoMaestroAdmin;
  readonly etiqueta: string;
  readonly singular: string;
  readonly permiteCrear: boolean;
  readonly permiteCambiarEstado: boolean;
}

export const CONFIGURACIONES_DATOS_MAESTROS: readonly ConfiguracionDatoMaestroAdmin[] = [
  {
    tipo: 'RUBRO',
    etiqueta: 'Rubros',
    singular: 'rubro',
    permiteCrear: true,
    permiteCambiarEstado: true,
  },
  {
    tipo: 'TIPO_PRODUCTO',
    etiqueta: 'Tipos de producto',
    singular: 'tipo de producto',
    permiteCrear: true,
    permiteCambiarEstado: true,
  },
  {
    tipo: 'TIPO_ENTREGA',
    etiqueta: 'Tipos de entrega',
    singular: 'tipo de entrega',
    permiteCrear: true,
    permiteCambiarEstado: true,
  },
  {
    tipo: 'TIPO_PAGO',
    etiqueta: 'Tipos de pago',
    singular: 'tipo de pago',
    permiteCrear: false,
    permiteCambiarEstado: false,
  },
  {
    tipo: 'TIPO_DOCUMENTO',
    etiqueta: 'Tipos de documento',
    singular: 'tipo de documento',
    permiteCrear: true,
    permiteCambiarEstado: true,
  },
];

export interface CategoriaDocumentoAdmin {
  readonly id: number;
  readonly nombre: string;
}

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

export interface ValoresFormularioDatoMaestro {
  readonly nombre: string;
  readonly descripcion: string;
  readonly abreviatura: string;
  readonly longitudMinima: number | null;
  readonly longitudMaxima: number | null;
  readonly idCategoriaDocumento: number | null;
}

export interface SolicitudGuardarDatoMaestro {
  readonly tipo: TipoDatoMaestroAdmin;
  readonly id: number | null;
  readonly valores: ValoresFormularioDatoMaestro;
}

export function obtenerConfiguracionDatoMaestro(
  tipo: TipoDatoMaestroAdmin,
): ConfiguracionDatoMaestroAdmin {
  return CONFIGURACIONES_DATOS_MAESTROS.find((configuracion) => configuracion.tipo === tipo)!;
}
