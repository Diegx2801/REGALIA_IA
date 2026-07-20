import {
  mapearResultadoRecomendacionIaDesdeDto,
  mapearSolicitudRecomendacionIaADto,
} from './builder-ia.mapper';

describe('builder-ia.mapper', () => {
  it('normaliza la descripción antes de enviarla al backend', () => {
    expect(mapearSolicitudRecomendacionIaADto({ busqueda: '  regalo para graduación  ' })).toEqual({
      busqueda: 'regalo para graduación',
    });
  });

  it('convierte recomendaciones reales y determina su disponibilidad', () => {
    const resultado = mapearResultadoRecomendacionIaDesdeDto({
      respuesta: '  Recomendación basada en la ocasión. ',
      productosRecomendados: [
        {
          idProducto: 8,
          idTienda: 2,
          nombreTienda: 'Detalles REGALIA',
          tipoProducto: 'PACK O BOX',
          nombre: 'Box premium',
          descripcion: 'Contenido especial',
          precio: 99,
          stock: 0,
        },
      ],
    });

    expect(resultado.respuesta).toBe('Recomendación basada en la ocasión.');
    expect(resultado.productosRecomendados[0]).toMatchObject({
      idProducto: 8,
      disponible: false,
      stock: 0,
    });
  });
});
