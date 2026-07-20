import {
  calcularDiasParaEntrega,
  convertirCodigoEnEtiqueta,
  formatearFechaCalendario,
  obtenerPresentacionEstadoPago,
  obtenerPresentacionEstadoPedido,
  obtenerPresentacionPagoPedido,
  obtenerPrioridadPedido,
} from './pedido-vendedor.presentacion';

describe('presentacion de pedidos del vendedor', () => {
  const hoy = new Date(2026, 6, 20, 15, 30);

  it('formatea fechas calendario sin desplazarlas por zona horaria', () => {
    expect(formatearFechaCalendario('2026-07-20')).toBe('20/07/2026');
    expect(formatearFechaCalendario('fecha-invalida')).toBe('Fecha no disponible');
  });

  it.each([
    ['RESERVADO', 'Nuevo · reservado', 'primaria'],
    ['en_preparacion', 'En preparación', 'advertencia'],
    [' LISTO ', 'Listo para entregar', 'exito'],
    ['ENTREGADO', 'Entregado', 'exito'],
    ['ANULADO', 'Anulado', 'error'],
  ] as const)(
    'presenta el estado %s con una etiqueta comprensible',
    (estado, etiqueta, variante) => {
      expect(obtenerPresentacionEstadoPedido(estado)).toEqual({ etiqueta, variante });
    },
  );

  it('convierte estados desconocidos sin exponer códigos técnicos', () => {
    expect(obtenerPresentacionEstadoPedido('PENDIENTE_CONFIRMACION')).toEqual({
      etiqueta: 'Pendiente confirmacion',
      variante: 'neutral',
    });
    expect(convertirCodigoEnEtiqueta('SIN_ESTADO')).toBe('Sin estado');
  });

  it.each([
    ['APROBADO', 'Aprobado', 'exito'],
    ['pendiente', 'Pendiente', 'advertencia'],
    ['RECHAZADO', 'Rechazado', 'error'],
    ['ANULADO', 'Anulado', 'error'],
  ] as const)('presenta el estado de pago %s', (estado, etiqueta, variante) => {
    expect(obtenerPresentacionEstadoPago(estado)).toEqual({ etiqueta, variante });
  });

  it.each([
    [{ montoPagado: 120, saldoPendiente: 0 }, 'Pago completo', 'exito'],
    [{ montoPagado: 40, saldoPendiente: 80 }, 'Pago parcial', 'advertencia'],
    [{ montoPagado: 0, saldoPendiente: 120 }, 'Pago pendiente', 'advertencia'],
  ] as const)('resume el pago a partir de importes reales', (pedido, etiqueta, variante) => {
    expect(obtenerPresentacionPagoPedido(pedido)).toEqual({ etiqueta, variante });
  });

  it.each([
    ['2026-07-18', 'urgente', '2 días de retraso'],
    ['2026-07-19', 'urgente', '1 día de retraso'],
    ['2026-07-20', 'urgente', 'Entrega programada para hoy'],
    ['2026-07-21', 'atencion', 'Entrega programada para mañana'],
  ] as const)('prioriza una entrega con fecha %s', (fechaEntrega, nivel, mensaje) => {
    const prioridad = obtenerPrioridadPedido(
      { estadoPedido: 'EN_PREPARACION', fechaEntrega, saldoPendiente: 0 },
      hoy,
    );

    expect(prioridad.nivel).toBe(nivel);
    expect(prioridad.mensaje).toBe(mensaje);
  });

  it.each([
    ['ENTREGADO', 'Completado', 'Entrega completada'],
    ['ANULADO', 'Cerrado', 'Pedido anulado'],
  ] as const)(
    'mantiene un pedido %s como resuelto aunque tenga una fecha vencida',
    (estado, etiqueta, mensaje) => {
      expect(
        obtenerPrioridadPedido(
          { estadoPedido: estado, fechaEntrega: '2026-07-01', saldoPendiente: 90 },
          hoy,
        ),
      ).toEqual({ nivel: 'resuelto', etiqueta, mensaje });
    },
  );

  it('distingue pedidos nuevos, listos con saldo y seguimiento normal', () => {
    expect(
      obtenerPrioridadPedido(
        { estadoPedido: 'RESERVADO', fechaEntrega: null, saldoPendiente: 0 },
        hoy,
      ).mensaje,
    ).toBe('Pedido nuevo por preparar');
    expect(
      obtenerPrioridadPedido({ estadoPedido: 'LISTO', fechaEntrega: null, saldoPendiente: 30 }, hoy)
        .mensaje,
    ).toBe('Listo con saldo pendiente');
    expect(
      obtenerPrioridadPedido(
        { estadoPedido: 'EN_PREPARACION', fechaEntrega: null, saldoPendiente: 0 },
        hoy,
      ).mensaje,
    ).toBe('Avanza según lo previsto');
  });

  it('calcula días con precisión de calendario e ignora fechas ausentes o mal formadas', () => {
    expect(calcularDiasParaEntrega('2026-07-21', hoy)).toBe(1);
    expect(calcularDiasParaEntrega('2026-07-19', hoy)).toBe(-1);
    expect(calcularDiasParaEntrega(null, hoy)).toBeNull();
    expect(calcularDiasParaEntrega('fecha-invalida', hoy)).toBeNull();
  });
});
