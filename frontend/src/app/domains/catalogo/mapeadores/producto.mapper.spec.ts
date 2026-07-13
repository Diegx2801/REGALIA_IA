import { mapearProductoDesdeDto } from './producto.mapper';

describe('mapearProductoDesdeDto', () => {
  it('normaliza datos reales del backend y ordena imagenes por prioridad visual', () => {
    const producto = mapearProductoDesdeDto({
      idProducto: 10,
      idTienda: 3,
      nombreTienda: ' Bienestar Natural ',
      idTipoProducto: 5,
      tipoProducto: ' ARREGLO FLORAL ',
      nombre: ' Ramo premium ',
      descripcion: ' Flores listas para regalar ',
      precio: 99.9,
      stock: 4,
      imagenes: [
        { urlImagen: '/assets/segunda.png', orden: 2 },
        { urlImagen: '/assets/primera.png', orden: 1 },
      ],
    });

    expect(producto).toMatchObject({
      idProducto: 10,
      nombreTienda: 'Bienestar Natural',
      tipoProducto: 'ARREGLO FLORAL',
      nombre: 'Ramo premium',
      descripcion: 'Flores listas para regalar',
      precio: 99.9,
      stock: 4,
      disponible: true,
    });
    expect(producto.imagenes.map((imagen) => imagen.urlImagen)).toEqual([
      '/assets/primera.png',
      '/assets/segunda.png',
    ]);
  });

  it('usa valores seguros cuando el backend devuelve campos opcionales vacios', () => {
    const producto = mapearProductoDesdeDto({
      idProducto: 1,
      idTienda: 1,
      nombreTienda: null,
      idTipoProducto: 1,
      tipoProducto: null,
      nombre: null,
      descripcion: null,
      precio: null,
      stock: null,
      imagenes: [{ urlImagen: '   ', orden: 1 }],
    });

    expect(producto.nombreTienda).toBe('Tienda REGALIA');
    expect(producto.nombre).toBe('Producto REGALIA');
    expect(producto.precio).toBe(0);
    expect(producto.disponible).toBe(false);
    expect(producto.imagenes).toEqual([
      { urlImagen: '/assets/brand/producto-fallback.svg', orden: 0 },
    ]);
  });
});
