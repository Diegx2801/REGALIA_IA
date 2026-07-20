import { PedidoRecibidoResumen } from '../modelos/vendedor.model';

export type VarianteSemanticaPedido = 'neutral' | 'primaria' | 'exito' | 'advertencia' | 'error';

export type NivelPrioridadPedido = 'urgente' | 'atencion' | 'seguimiento' | 'resuelto';

export interface PresentacionEstadoPedido {
  etiqueta: string;
  variante: VarianteSemanticaPedido;
}

export interface PresentacionPrioridadPedido {
  nivel: NivelPrioridadPedido;
  etiqueta: string;
  mensaje: string;
}

export interface PresentacionPagoPedido {
  etiqueta: string;
  variante: VarianteSemanticaPedido;
}

const MILISEGUNDOS_POR_DIA = 86_400_000;
const ESTADOS_FINALIZADOS = new Set(['ENTREGADO', 'ANULADO']);

const ESTADOS_PEDIDO: Record<string, PresentacionEstadoPedido> = {
  RESERVADO: { etiqueta: 'Nuevo · reservado', variante: 'primaria' },
  EN_PREPARACION: { etiqueta: 'En preparación', variante: 'advertencia' },
  LISTO: { etiqueta: 'Listo para entregar', variante: 'exito' },
  ENTREGADO: { etiqueta: 'Entregado', variante: 'exito' },
  ANULADO: { etiqueta: 'Anulado', variante: 'error' },
};

const ESTADOS_PAGO: Record<string, PresentacionEstadoPedido> = {
  APROBADO: { etiqueta: 'Aprobado', variante: 'exito' },
  PENDIENTE: { etiqueta: 'Pendiente', variante: 'advertencia' },
  RECHAZADO: { etiqueta: 'Rechazado', variante: 'error' },
  ANULADO: { etiqueta: 'Anulado', variante: 'error' },
};

export function obtenerPresentacionEstadoPedido(estado: string): PresentacionEstadoPedido {
  const codigo = normalizarCodigo(estado);
  return (
    ESTADOS_PEDIDO[codigo] ?? {
      etiqueta: convertirCodigoEnEtiqueta(codigo || 'SIN_ESTADO'),
      variante: 'neutral',
    }
  );
}

export function obtenerPresentacionEstadoPago(estado: string): PresentacionEstadoPedido {
  const codigo = normalizarCodigo(estado);
  return (
    ESTADOS_PAGO[codigo] ?? {
      etiqueta: convertirCodigoEnEtiqueta(codigo || 'SIN_ESTADO'),
      variante: 'neutral',
    }
  );
}

export function obtenerPresentacionPagoPedido(
  pedido: Pick<PedidoRecibidoResumen, 'montoPagado' | 'saldoPendiente'>,
): PresentacionPagoPedido {
  if (pedido.saldoPendiente <= 0) {
    return { etiqueta: 'Pago completo', variante: 'exito' };
  }

  if (pedido.montoPagado > 0) {
    return { etiqueta: 'Pago parcial', variante: 'advertencia' };
  }

  return { etiqueta: 'Pago pendiente', variante: 'advertencia' };
}

export function obtenerPrioridadPedido(
  pedido: Pick<PedidoRecibidoResumen, 'estadoPedido' | 'fechaEntrega' | 'saldoPendiente'>,
  hoy = new Date(),
): PresentacionPrioridadPedido {
  const estado = normalizarCodigo(pedido.estadoPedido);

  if (ESTADOS_FINALIZADOS.has(estado)) {
    return {
      nivel: 'resuelto',
      etiqueta: estado === 'ANULADO' ? 'Cerrado' : 'Completado',
      mensaje: estado === 'ANULADO' ? 'Pedido anulado' : 'Entrega completada',
    };
  }

  const diasParaEntrega = calcularDiasParaEntrega(pedido.fechaEntrega, hoy);
  if (diasParaEntrega !== null && diasParaEntrega < 0) {
    const diasRetraso = Math.abs(diasParaEntrega);
    return {
      nivel: 'urgente',
      etiqueta: 'Urgente',
      mensaje: `${diasRetraso} ${diasRetraso === 1 ? 'día' : 'días'} de retraso`,
    };
  }

  if (diasParaEntrega === 0) {
    return { nivel: 'urgente', etiqueta: 'Urgente', mensaje: 'Entrega programada para hoy' };
  }

  if (diasParaEntrega === 1) {
    return { nivel: 'atencion', etiqueta: 'Atención', mensaje: 'Entrega programada para mañana' };
  }

  if (estado === 'RESERVADO') {
    return { nivel: 'atencion', etiqueta: 'Atención', mensaje: 'Pedido nuevo por preparar' };
  }

  if (estado === 'LISTO' && pedido.saldoPendiente > 0) {
    return { nivel: 'atencion', etiqueta: 'Atención', mensaje: 'Listo con saldo pendiente' };
  }

  if (estado === 'LISTO') {
    return { nivel: 'seguimiento', etiqueta: 'En seguimiento', mensaje: 'Listo para entregar' };
  }

  if (pedido.saldoPendiente > 0) {
    return { nivel: 'seguimiento', etiqueta: 'En seguimiento', mensaje: 'Pago por completar' };
  }

  return { nivel: 'seguimiento', etiqueta: 'En seguimiento', mensaje: 'Avanza según lo previsto' };
}

export function calcularDiasParaEntrega(
  fechaEntrega: string | null,
  hoy = new Date(),
): number | null {
  if (!fechaEntrega) return null;

  const partes = fechaEntrega.split('-').map(Number);
  if (partes.length !== 3 || partes.some((parte) => !Number.isFinite(parte))) return null;

  const [anio, mes, dia] = partes;
  const entregaUtc = Date.UTC(anio, mes - 1, dia);
  const hoyUtc = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((entregaUtc - hoyUtc) / MILISEGUNDOS_POR_DIA);
}

/** Formatea un LocalDate del backend sin convertirlo a UTC ni alterar el día por zona horaria. */
export function formatearFechaCalendario(fecha: string): string {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha.trim());
  if (!coincidencia) return 'Fecha no disponible';

  const [, anio, mes, dia] = coincidencia;
  return `${dia}/${mes}/${anio}`;
}

export function convertirCodigoEnEtiqueta(codigo: string): string {
  const texto = codigo.toLowerCase().replaceAll('_', ' ').replace(/\s+/g, ' ').trim();

  return texto ? `${texto.charAt(0).toUpperCase()}${texto.slice(1)}` : 'Sin estado';
}

function normalizarCodigo(valor: string): string {
  return valor.trim().toUpperCase();
}
