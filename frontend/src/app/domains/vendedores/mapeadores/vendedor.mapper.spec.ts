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
      { urlImagen: '/productos/primera.webp', orden: 1 },
      { urlImagen: '/productos/segunda.webp', orden: 2 },
      { urlImagen: '/productos/tercera.webp', orden: 3 },
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

  it('recorta las URL y conserva la coleccion de imagenes en el DTO de solicitud', () => {
    const dto = mapearSolicitudProductoADto(
      crearSolicitud({
        imagenes: [
          { urlImagen: ' https://cdn.regalia.pe/segunda.webp ', orden: 2 },
          { urlImagen: '   ', orden: 99 },
          { urlImagen: ' https://cdn.regalia.pe/primera.webp ', orden: 1 },
        ],
      }),
    );

    expect(dto).toEqual({
      idTipoProducto: 4,
      nombre: 'Box aniversario',
      descripcion: 'Incluye una dedicatoria',
      precio: 129.9,
      stock: 8,
      visibleEnTienda: true,
      imagenes: [
        { urlImagen: 'https://cdn.regalia.pe/segunda.webp', orden: 2 },
        { urlImagen: 'https://cdn.regalia.pe/primera.webp', orden: 1 },
      ],
    });
  });

  it('envia imagenes como null cuando la solicitud no contiene URL validas', () => {
    const dto = mapearSolicitudProductoADto(
      crearSolicitud({
        imagenes: [
          { urlImagen: '', orden: 1 },
          { urlImagen: '   ', orden: 2 },
        ],
      }),
    );

    expect(dto.imagenes).toBeNull();
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
    imagenes: [],
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
    imagenes: [],
    ...cambios,
  };
}
