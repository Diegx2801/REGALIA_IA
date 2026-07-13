import { Producto } from '../../../domains/catalogo/modelos/producto.model';
import {
  BuilderIaProductoRecomendadoDto,
  BuilderIaRecomendacionRequestDto,
  BuilderIaRecomendacionResponseDto,
} from '../modelos/builder-ia.dto';
import { ResultadoRecomendacionIa, SolicitudRecomendacionIa } from '../modelos/builder-ia.model';

const IMAGEN_PRODUCTO_RECOMENDADO_FALLBACK = '/assets/brand/producto-fallback.svg';

export function mapearSolicitudRecomendacionIaADto(
  solicitud: SolicitudRecomendacionIa,
): BuilderIaRecomendacionRequestDto {
  return {
    busqueda: solicitud.busqueda.trim(),
  };
}

export function mapearResultadoRecomendacionIaDesdeDto(
  dto: BuilderIaRecomendacionResponseDto,
): ResultadoRecomendacionIa {
  return {
    respuesta: dto.respuesta?.trim() || 'No se recibio una interpretacion del asistente IA.',
    productosRecomendados: (dto.productosRecomendados ?? []).map(mapearProductoRecomendadoDesdeDto),
  };
}

function mapearProductoRecomendadoDesdeDto(dto: BuilderIaProductoRecomendadoDto): Producto {
  const stock = Number(dto.stock ?? 0);

  return {
    idProducto: dto.idProducto,
    idTienda: dto.idTienda,
    nombreTienda: dto.nombreTienda?.trim() || 'Tienda REGALIA',
    idTipoProducto: 0,
    tipoProducto: dto.tipoProducto?.trim() || 'Producto personalizado',
    nombre: dto.nombre?.trim() || 'Producto recomendado',
    descripcion: dto.descripcion?.trim() || 'Producto recomendado por el asistente IA de REGALIA.',
    precio: Number(dto.precio ?? 0),
    stock,
    imagenes: [{ urlImagen: IMAGEN_PRODUCTO_RECOMENDADO_FALLBACK, orden: 0 }],
    disponible: stock > 0,
  };
}
