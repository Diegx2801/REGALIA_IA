import { ProductoVendedorDto } from '../modelos/vendedor.dto';
import { SolicitudProductoVendedor } from '../modelos/vendedor.model';
import {
  mapearProductoVendedorDesdeDto,
  mapearSolicitudProductoADto,
} from './vendedor.mapper';

describe('vendedor.mapper', () => {
  it('conserva todas las imagenes validas, las normaliza y las ordena por prioridad', () => {
    const producto = mapearProductoVendedorDesdeDto(
      crearProductoDto({
        imagenes: [
          { idProductoImagen: 20, urlImagen: ' /productos/segunda.webp ', orden: 2 },
          { idProductoImagen: 10, urlImagen: ' /productos/primera.webp ', orden: 1 },
          { idProductoImagen: 30, urlImagen: ' /productos/tercera.webp ', orden: 3 },
        ],
      }),
    );

    expect(producto.imagenes).toEqual([
      { idProductoImagen: 10, urlImagen: '/productos/primera.webp', orden: 1 },
      { idProductoImagen: 20, urlImagen: '/productos/segunda.webp', orden: 2 },
      { idProductoImagen: 30, urlImagen: '/productos/tercera.webp', orden: 3 },
    ]);
    expect(producto.urlImagen).toBe('/productos/primera.webp');
  });

  it('usa el fallback visual cuando el backend no entrega imagenes validas', () => {
    const producto = mapearProductoVendedorDesdeDto(
      crearProductoDto({
        imagenes: [
          { idProductoImagen: 1, urlImagen: null, orden: 1 },
          { idProductoImagen: 2, urlImagen: '   ', orden: 2 },
        ],
      }),
    );

    expect(producto.imagenes).toEqual([]);
    expect(producto.urlImagen).toBe('/assets/brand/producto-fallback.svg');
  });

  it('no envía URLs de imágenes al crear o actualizar un producto', () => {
    const dto = mapearSolicitudProductoADto(crearSolicitud());

    expect(dto).toEqual({
      idTipoProducto: 4,
      nombre: 'Box aniversario',
      descripcion: 'Incluye una dedicatoria',
      precio: 129.9,
      stock: 8,
      visibleEnTienda: true,
    });
  });
});

function crearProductoDto(
  cambios: Partial<ProductoVendedorDto> = {},
): ProductoVendedorDto {
  return {
    idProducto: 15,
    idTienda: 10,
    nombreTienda: 'Regalos REGALIA',
    idTipoProducto: 4,
    tipoProducto: 'Box personalizado',
    nombre: 'Box aniversario',
    descripcion: 'Incluye una dedicatoria',
    precio: 129.9,
    stock: 8,
    visibleEnTienda: true,
    imagenes: null,
    estado: true,
    fechaCreacion: '2026-07-20T10:00:00',
    fechaActualizacion: null,
    ...cambios,
  };
}

function crearSolicitud(
  cambios: Partial<SolicitudProductoVendedor> = {},
): SolicitudProductoVendedor {
  return {
    idTipoProducto: 4,
    nombre: 'Box aniversario',
    descripcion: 'Incluye una dedicatoria',
    precio: 129.9,
    stock: 8,
    visibleEnTienda: true,
    ...cambios,
  };
}
