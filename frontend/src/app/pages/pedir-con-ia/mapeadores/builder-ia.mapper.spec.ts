import { describe, expect, it } from 'vitest';
import { mapearResultadoRecomendacionIaDesdeDto } from './builder-ia.mapper';

describe('builder-ia.mapper', () => {
  it('conserva la razon junto al producto real recomendado', () => {
    const resultado = mapearResultadoRecomendacionIaDesdeDto({
      respuesta: 'Una opcion elegante.',
      productosRecomendados: [
        {
          idProducto: 7,
          nombre: 'Ramo premium',
          descripcion: 'Flores frescas',
          precio: 120,
          stock: 3,
          idTienda: 2,
          nombreTienda: 'Floristeria',
          tipoProducto: 'Flores',
          razon: 'Es apropiado para un aniversario.',
        },
      ],
    });

    expect(resultado.productosRecomendados).toEqual([
      expect.objectContaining({
        razon: 'Es apropiado para un aniversario.',
        producto: expect.objectContaining({ idProducto: 7, disponible: true }),
      }),
    ]);
  });
});
