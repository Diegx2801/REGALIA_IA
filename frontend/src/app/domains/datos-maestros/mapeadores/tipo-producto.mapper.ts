import { TipoProductoDto } from '../modelos/tipo-producto.dto';
import { TipoProducto } from '../modelos/tipo-producto.model';

export function mapearTipoProductoDesdeDto(dto: TipoProductoDto): TipoProducto {
  return {
    idTipoProducto: dto.idTipoProducto,
    nombre: dto.nombre?.trim() || 'Producto personalizado',
    estado: Boolean(dto.estado),
  };
}
