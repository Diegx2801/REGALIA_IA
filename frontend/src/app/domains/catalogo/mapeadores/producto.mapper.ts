import { ProductoPublicoDto } from '../modelos/producto.dto';
import { ImagenProducto, Producto } from '../modelos/producto.model';

const IMAGEN_PRODUCTO_FALLBACK = '/assets/brand/producto-fallback.svg';

export function mapearProductoDesdeDto(dto: ProductoPublicoDto): Producto {
  const stock = Number(dto.stock ?? 0);

  return {
    idProducto: dto.idProducto,
    idTienda: dto.idTienda,
    nombreTienda: dto.nombreTienda?.trim() || 'Tienda REGALIA',
    idTipoProducto: dto.idTipoProducto,
    tipoProducto: dto.tipoProducto?.trim() || 'Producto personalizado',
    nombre: dto.nombre?.trim() || 'Producto REGALIA',
    descripcion: dto.descripcion?.trim() || 'Detalle personalizado disponible en REGALIA.',
    precio: Number(dto.precio ?? 0),
    stock,
    imagenes: mapearImagenesDesdeDto(dto),
    disponible: stock > 0,
  };
}

function mapearImagenesDesdeDto(dto: ProductoPublicoDto): ImagenProducto[] {
  const imagenes = dto.imagenes ?? [];
  const normalizadas = imagenes
    .filter((imagen) => Boolean(imagen.urlImagen?.trim()))
    .map((imagen) => ({
      urlImagen: imagen.urlImagen?.trim() ?? IMAGEN_PRODUCTO_FALLBACK,
      orden: imagen.orden ?? 0,
    }))
    .sort((actual, siguiente) => actual.orden - siguiente.orden);

  return normalizadas.length > 0
    ? normalizadas
    : [{ urlImagen: IMAGEN_PRODUCTO_FALLBACK, orden: 0 }];
}
