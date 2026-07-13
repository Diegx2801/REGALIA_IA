import {
  mapearOpcionPagoInicialDesdeDto,
  mapearResultadoCheckoutDesdeDto,
  mapearSolicitudCheckoutADto,
} from './checkout.mapper';

describe('checkout.mapper', () => {
  it('envia al backend solo los campos contractuales del checkout', () => {
    const dto = mapearSolicitudCheckoutADto({
      proveedor: 'MANUAL',
      idTienda: 1,
      idTipoEntrega: 2,
      codigoTipoPago: 'YAPE',
      fechaEntrega: '2026-07-20',
      observacion: 'Dedicatoria corta',
      items: [
        { idProducto: 10, cantidad: 2 },
        { idProducto: 11, cantidad: 1 },
      ],
    });

    expect(dto).toEqual({
      provider: 'MANUAL',
      idTienda: 1,
      idTipoEntrega: 2,
      codigoTipoPago: 'YAPE',
      fechaEntrega: '2026-07-20',
      observacion: 'Dedicatoria corta',
      items: [
        { idProducto: 10, cantidad: 2 },
        { idProducto: 11, cantidad: 1 },
      ],
    });
  });

  it('prioriza redirectUrl y conserva fallback de moneda PEN', () => {
    const resultado = mapearResultadoCheckoutDesdeDto({
      provider: 'MERCADO_PAGO',
      preferenceId: 'pref-1',
      externalReference: 'REG-1',
      amount: 129,
      currency: '',
      initPoint: 'https://init.example',
      sandboxInitPoint: 'https://sandbox.example',
      redirectUrl: 'https://redirect.example',
    });

    expect(resultado).toMatchObject({
      proveedor: 'MERCADO_PAGO',
      referenciaExterna: 'REG-1',
      monto: 129,
      moneda: 'PEN',
      urlRedireccion: 'https://redirect.example',
    });
  });

  it('mapea opciones de pago inicial sin transformar codigos del backend', () => {
    expect(
      mapearOpcionPagoInicialDesdeDto({
        codigo: 'TRANSFERENCIA',
        nombre: 'Transferencia bancaria',
        descripcion: null,
      }),
    ).toEqual({
      codigo: 'TRANSFERENCIA',
      nombre: 'Transferencia bancaria',
      descripcion: null,
    });
  });
});
